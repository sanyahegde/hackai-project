from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from db import get_db, get_profiles, get_concept_logs
from models import ProfileRequest, LogConceptRequest, SpeakRequest


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Verify MongoDB connection at startup (ping + log database name)
    try:
        get_db()
    except Exception as e:
        print(f"[MongoDB] Startup connection failed: {e}")
        raise
    yield


app = FastAPI(title="LearnFlow API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/profile", status_code=201)
async def save_profile(body: ProfileRequest):
    """Save onboarding profile (role, goal, existing_skills, time_constraint). Upsert by user_id."""
    print("[POST /api/profile] Incoming payload:", body.model_dump())
    doc = {
        "user_id": body.user_id,
        "role": body.role,
        "goal": body.goal,
        "existing_skills": body.existing_skills,
        "time_constraint": body.time_constraint,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        col = get_profiles()
        col.update_one(
            {"user_id": body.user_id},
            {"$set": doc},
            upsert=True,
        )
        print("[POST /api/profile] MongoDB save succeeded for user_id:", body.user_id)
        return {"status": "ok", "user_id": body.user_id}
    except Exception as e:
        print("[POST /api/profile] MongoDB save failed:", e)
        raise HTTPException(status_code=500, detail="Profile save failed")


@app.get("/api/profile/{user_id}")
async def get_profile(user_id: str):
    """Get profile by user_id."""
    try:
        col = get_profiles()
        doc = col.find_one({"user_id": user_id}, {"_id": 0})
        if doc is None:
            raise HTTPException(status_code=404, detail="Profile not found")
        return doc
    except HTTPException:
        raise
    except Exception as e:
        print("[GET /api/profile] Error:", e)
        raise HTTPException(status_code=500, detail="Profile fetch failed")


# ─── Concept click logging (concept_logs collection) ───

@app.post("/api/log-concept", status_code=201)
async def log_concept(body: LogConceptRequest):
    """Log a concept bubble click. Stored in concept_logs for click-driven recommendations."""
    doc = {
        "user_id": body.user_id,
        "video_id": body.video_id or "",
        "concept_name": body.concept,
        "category": body.category or "general",
        "timestamp": body.timestamp,
        "clicked_at": datetime.now(timezone.utc).isoformat(),
    }
    print("[POST /api/log-concept] Incoming payload:", body.model_dump())
    try:
        col = get_concept_logs()
        col.insert_one(doc)
        print("[POST /api/log-concept] MongoDB save succeeded")
        return {"status": "ok"}
    except Exception as e:
        print("[POST /api/log-concept] MongoDB save failed:", e)
        raise HTTPException(status_code=500, detail="Concept log failed")


# ─── Click-driven recommendations (no sentence-transformers) ───

@app.get("/api/recommendations/{user_id}")
async def get_recommendations(user_id: str):
    """
    Recommend next topic based on most-clicked concept (and optionally category).
    Returns topic, reason, recommended_query for the frontend to use (e.g. video search).
    """
    col = get_concept_logs()
    cursor = col.find({"user_id": user_id})
    logs = list(cursor)
    if not logs:
        result = {
            "topic": "Getting started",
            "reason": "You haven't clicked any concepts yet. Pause a video, click concept bubbles, and we'll recommend your next video.",
            "recommended_query": "data structures and algorithms tutorial",
        }
        print("[GET /api/recommendations] No clicks for user_id:", user_id, "-> default recommendation")
        return result

    # Count by concept_name
    concept_counts = {}
    category_counts = {}
    for log in logs:
        name = log.get("concept_name") or log.get("concept") or ""
        cat = log.get("category") or "general"
        if name:
            concept_counts[name] = concept_counts.get(name, 0) + 1
        category_counts[cat] = category_counts.get(cat, 0) + 1

    # Top concept wins; fallback to top category
    top_concept = max(concept_counts.items(), key=lambda x: x[1]) if concept_counts else (None, 0)
    top_category = max(category_counts.items(), key=lambda x: x[1]) if category_counts else (None, 0)
    topic = top_concept[0] if top_concept[0] else (top_category[0] or "Getting started")
    count = top_concept[1] if top_concept[0] else top_category[1]

    reason = (
        f"You clicked {topic} {count} time(s), so this appears to be a key area of interest or confusion."
    )
    recommended_query = f"{topic} tutorial"

    result = {
        "topic": topic,
        "reason": reason,
        "recommended_query": recommended_query,
    }
    print("[GET /api/recommendations] user_id:", user_id, "->", result)
    return result


# ─── Skill scores from learning log (TF-IDF + cosine similarity) ───

@app.get("/api/skill-scores/{user_id}")
async def skill_scores(user_id: str):
    """
    Compute skill scores (0-100) and gaps from concept click history.
    Uses TF-IDF + cosine similarity against a predefined DSA skill map.
    """
    col = get_concept_logs()
    logs = list(col.find({"user_id": user_id}))
    try:
        from services.skill_scorer import compute_skill_scores_from_logs
        scores_list, top_gaps, learn_next, reason = compute_skill_scores_from_logs(logs)
    except Exception as e:
        print("[GET /api/skill-scores] Error:", e)
        raise HTTPException(status_code=500, detail=str(e))
    return {
        "user_id": user_id,
        "scores": scores_list,
        "top_gaps": top_gaps,
        "learn_next": learn_next,
        "reason": reason,
    }


# ─── Optional: YouTube search for "Watch next" (no recommender model) ───

@app.get("/api/video-for-topic")
async def video_for_topic(topic: str = ""):
    """Return one YouTube video for the given topic (search only; no ML)."""
    if not topic or not topic.strip():
        return {"video_id": None, "title": None, "url": None, "error": "Topic is required"}
    try:
        from services.youtube import search_videos
        videos = search_videos(topic.strip(), max_results=1)
        if videos:
            v = videos[0]
            return {"video_id": v["id"], "title": v.get("title"), "url": v.get("url"), "error": None}
        return {"video_id": None, "title": None, "url": None, "error": "No videos found"}
    except Exception as e:
        print("[GET /api/video-for-topic] Error:", e)
        return {"video_id": None, "title": None, "url": None, "error": str(e)}


@app.post("/api/speak")
async def speak(body: SpeakRequest):
    """Convert text to speech using ElevenLabs API and return audio."""
    import httpx
    from config import ELEVENLABS_API_KEY
    
    if not ELEVENLABS_API_KEY:
        raise HTTPException(status_code=500, detail="ElevenLabs API key not configured")
    
    if not body.text or not body.text.strip():
        raise HTTPException(status_code=400, detail="Text is required")
    
    try:
        url = "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM"
        headers = {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
        }
        payload = {
            "text": body.text.strip(),
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
            }
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            audio_bytes = response.content
            
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"ElevenLabs API error: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text-to-speech failed: {str(e)}")
