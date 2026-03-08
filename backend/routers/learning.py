from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from db import get_learning_history, get_watched_videos, get_profiles
from models import LogConceptRequest, LogWatchedRequest, ProfileRequest, SpeakRequest
from services.skill_scorer import compute_skill_scores
from services.recommender import get_recommendations, get_video_for_topic

router = APIRouter(prefix="/api")


@router.post("/profile", status_code=201)
async def save_profile(body: ProfileRequest):
    """Save onboarding profile (role, goal, existing_skills, time_constraint)."""
    col = get_profiles()
    doc = {
        "user_id": body.user_id,
        "role": body.role,
        "goal": body.goal,
        "existing_skills": body.existing_skills,
        "time_constraint": body.time_constraint,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    col.update_one(
        {"user_id": body.user_id},
        {"$set": doc},
        upsert=True,
    )
    return {"status": "ok", "user_id": body.user_id}


@router.post("/log-watched", status_code=201)
async def log_watched(body: LogWatchedRequest):
    """Mark a video as watched so it won't be recommended again."""
    col = get_watched_videos()
    col.update_one(
        {"user_id": body.user_id, "video_id": body.video_id},
        {"$set": {"user_id": body.user_id, "video_id": body.video_id}},
        upsert=True,
    )
    return {"status": "ok"}


@router.post("/log-concept", status_code=201)
async def log_concept(body: LogConceptRequest):
    col = get_learning_history()
    doc = {
        "user_id": body.user_id,
        "concept": body.concept,
        "category": body.category,
        "video_id": body.video_id,
        "timestamp": body.timestamp,
        "logged_at": datetime.now(timezone.utc).isoformat(),
    }
    col.insert_one(doc)
    return {"status": "ok"}


@router.get("/learning-history/{user_id}")
async def learning_history(user_id: str):
    col = get_learning_history()
    docs = list(col.find({"user_id": user_id}, {"_id": 0}))
    return {"user_id": user_id, "history": docs}


@router.get("/skill-scores/{user_id}")
async def skill_scores(user_id: str):
    col = get_learning_history()
    docs = list(col.find({"user_id": user_id}, {"_id": 0}))
    if not docs:
        return {"user_id": user_id, "scores": {}, "gaps": []}
    scores = compute_skill_scores(docs)
    # gaps sorted lowest first
    gaps = sorted(scores.items(), key=lambda x: x[1])
    return {
        "user_id": user_id,
        "scores": scores,
        "gaps": [{"category": k, "score": v} for k, v in gaps],
    }


@router.get("/video-for-topic")
async def video_for_topic(topic: str = ""):
    """Get the best YouTube video for a topic (word or phrase)."""
    if not topic.strip():
        return {"video_id": None, "title": None, "url": None, "error": "Topic is required"}
    try:
        result = await get_video_for_topic(topic)
        if result:
            return result
        return {"video_id": None, "title": None, "url": None, "error": "No videos found"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations/{user_id}")
async def recommendations(user_id: str):
    col = get_learning_history()
    watched_col = get_watched_videos()
    docs = list(col.find({"user_id": user_id}, {"_id": 0}))
    if not docs:
        return {"user_id": user_id, "recommendations": [], "message": "No learning history yet. Start watching and clicking concepts!"}

    # Videos to exclude: from learning_history + watched_videos
    watched_ids = {d["video_id"] for d in docs if d.get("video_id")}
    for w in watched_col.find({"user_id": user_id}, {"video_id": 1}):
        watched_ids.add(w["video_id"])

    scores = compute_skill_scores(docs)
    gaps = sorted(scores.items(), key=lambda x: x[1])
    weak_categories = [k for k, _ in gaps[:2]]

    try:
        results = await get_recommendations(docs, weak_categories, watched_video_ids=watched_ids)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"user_id": user_id, "recommendations": results, "gaps_addressed": weak_categories}


@router.post("/speak")
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
