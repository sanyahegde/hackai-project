from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

LEVELS = ["beginner", "intermediate", "advanced"]
PREFERENCE_OPTIONS = ["videos", "diagrams", "hands-on", "summaries"]

TARGET_OUTCOMES = [
    "stay current in my field",
    "become more effective at work",
    "transition into a new role",
    "build real-world projects",
    "prepare for interviews",
    "deep technical understanding",
]

FOCUS_AREAS = [
    "ML fundamentals",
    "LLM applications",
    "AI engineering",
    "research & theory",
    "production systems",
]

EXPLANATION_DEPTHS = ["quick intuition", "balanced overview", "deep technical breakdown"]

LEARNING_FRICTION_OPTIONS = [
    "too much theory",
    "diagrams I don't understand",
    "missing prerequisites",
    "videos move too fast",
    "not enough real examples",
]


class ProfileCreate(BaseModel):
    role: str = Field(..., min_length=1, description="Current role")
    resumeText: Optional[str] = Field(None, description="Optional resume/background text")
    goal: str = Field(..., min_length=1, description="What you are trying to learn")
    reason: str = Field(..., min_length=1, description="Why you are learning it")
    targetOutcome: list[str] = Field(default_factory=list, description="Target outcomes (multi-select)")
    level: str = Field(..., description="Knowledge level")
    skills: list[str] = Field(default_factory=list, description="Relevant existing skills")
    focusArea: list[str] = Field(default_factory=list, description="Area of focus within the topic")
    preferences: list[str] = Field(default_factory=list, description="Preferred learning formats")
    explanationDepth: str = Field(..., description="Explanation depth preference")
    learningFriction: list[str] = Field(default_factory=list, description="Learning friction (multi-select)")
    timePerWeek: Optional[str] = Field(None, description="Time available per week (optional)")

    class Config:
        json_schema_extra = {
            "example": {
                "role": "Software Engineer",
                "resumeText": None,
                "goal": "Machine Learning",
                "reason": "Career growth",
                "targetOutcome": ["build real-world projects"],
                "level": "intermediate",
                "skills": ["Python", "Statistics"],
                "focusArea": ["ML fundamentals"],
                "preferences": ["videos", "hands-on"],
                "explanationDepth": "balanced overview",
                "learningFriction": [],
                "timePerWeek": None,
            }
        }


class ProfileResponse(BaseModel):
    id: str
    role: str
    resumeText: Optional[str] = None
    goal: str
    reason: str
    targetOutcome: list[str]
    level: str
    skills: list[str]
    focusArea: list[str]
    preferences: list[str]
    explanationDepth: str
    learningFriction: list[str]
    timePerWeek: Optional[str] = None
    createdAt: datetime
