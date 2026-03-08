from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from db import get_learning_history
from models import LogConceptRequest
from services.skill_scorer import compute_skill_scores
from services.recommender import get_recommendations

router = APIRouter(prefix="/api")


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


@router.get("/recommendations/{user_id}")
async def recommendations(user_id: str):
    col = get_learning_history()
    docs = list(col.find({"user_id": user_id}, {"_id": 0}))
    if not docs:
        return {"user_id": user_id, "recommendations": [], "message": "No learning history yet. Start watching and clicking concepts!"}

    scores = compute_skill_scores(docs)
    gaps = sorted(scores.items(), key=lambda x: x[1])
    # take the weakest 2 categories
    weak_categories = [k for k, _ in gaps[:2]]

    try:
        results = await get_recommendations(docs, weak_categories)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"user_id": user_id, "recommendations": results, "gaps_addressed": weak_categories}
