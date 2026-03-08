from pydantic import BaseModel, Field, model_validator


class LogConceptRequest(BaseModel):
    user_id: str
    concept: str = ""
    category: str = "general"
    video_id: str = ""
    timestamp: float = Field(..., ge=0)

    @model_validator(mode="before")
    @classmethod
    def accept_concept_name(cls, data):
        """Allow JSON to send either "concept" or "concept_name"."""
        if isinstance(data, dict):
            concept = data.get("concept") or data.get("concept_name")
            if concept is not None:
                data = {**data, "concept": concept}
        return data


class LogWatchedRequest(BaseModel):
    user_id: str
    video_id: str


class ProfileRequest(BaseModel):
    user_id: str
    role: str
    goal: str
    existing_skills: list[str] = Field(default_factory=list)
    time_constraint: str | None = None
