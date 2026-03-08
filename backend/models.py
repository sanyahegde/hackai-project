from pydantic import BaseModel, Field


class LogConceptRequest(BaseModel):
    user_id: str
    concept: str
    category: str
    video_id: str
    timestamp: float = Field(..., ge=0)
