from datetime import datetime
from bson import ObjectId
from fastapi import APIRouter, HTTPException
from app.models import (
    ProfileCreate,
    ProfileResponse,
    LEVELS,
    PREFERENCE_OPTIONS,
    TARGET_OUTCOMES,
    FOCUS_AREAS,
    EXPLANATION_DEPTHS,
    LEARNING_FRICTION_OPTIONS,
)
from app.database import users_collection

router = APIRouter(prefix="/profile", tags=["profile"])


def validate_level(level: str) -> None:
    if level not in LEVELS:
        raise HTTPException(
            status_code=400,
            detail=f"level must be one of: {', '.join(LEVELS)}",
        )


def validate_preferences(preferences: list[str]) -> None:
    invalid = [p for p in preferences if p not in PREFERENCE_OPTIONS]
    if invalid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid preferences: {invalid}. Allowed: {', '.join(PREFERENCE_OPTIONS)}",
        )


def validate_target_outcomes(target_outcome: list[str]) -> None:
    invalid = [t for t in target_outcome if t not in TARGET_OUTCOMES]
    if invalid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid targetOutcome: {invalid}",
        )


def validate_focus_areas(focus_area: list[str]) -> None:
    invalid = [f for f in focus_area if f not in FOCUS_AREAS]
    if invalid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid focusArea: {invalid}",
        )


def validate_explanation_depth(depth: str) -> None:
    if depth not in EXPLANATION_DEPTHS:
        raise HTTPException(
            status_code=400,
            detail=f"explanationDepth must be one of: {', '.join(EXPLANATION_DEPTHS)}",
        )


def validate_learning_friction(friction: list[str]) -> None:
    invalid = [f for f in friction if f not in LEARNING_FRICTION_OPTIONS]
    if invalid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid learningFriction: {invalid}",
        )


def doc_to_response(doc: dict) -> ProfileResponse:
    return ProfileResponse(
        id=str(doc["_id"]),
        role=doc["role"],
        resumeText=doc.get("resumeText"),
        goal=doc["goal"],
        reason=doc["reason"],
        targetOutcome=doc.get("targetOutcome", []),
        level=doc["level"],
        skills=doc.get("skills", []),
        focusArea=doc.get("focusArea", []),
        preferences=doc.get("preferences", []),
        explanationDepth=doc.get("explanationDepth", "balanced overview"),
        learningFriction=doc.get("learningFriction", []),
        timePerWeek=doc.get("timePerWeek"),
        createdAt=doc["createdAt"],
    )


@router.post("", response_model=ProfileResponse)
async def create_profile(body: ProfileCreate):
    validate_level(body.level)
    validate_preferences(body.preferences)
    validate_target_outcomes(body.targetOutcome)
    validate_focus_areas(body.focusArea)
    validate_explanation_depth(body.explanationDepth)
    validate_learning_friction(body.learningFriction)

    doc = {
        "role": body.role,
        "resumeText": body.resumeText,
        "goal": body.goal,
        "reason": body.reason,
        "targetOutcome": body.targetOutcome,
        "level": body.level,
        "skills": body.skills,
        "focusArea": body.focusArea,
        "preferences": body.preferences,
        "explanationDepth": body.explanationDepth,
        "learningFriction": body.learningFriction,
        "timePerWeek": body.timePerWeek,
        "createdAt": datetime.utcnow(),
    }
    result = await users_collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    doc["createdAt"] = doc["createdAt"]
    return doc_to_response(doc)


@router.get("/{user_id}", response_model=ProfileResponse)
async def get_profile(user_id: str):
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user id")

    doc = await users_collection.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Profile not found")

    return doc_to_response(doc)
