from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from enum import Enum

class WorkshopStatus(str, Enum):
    draft = "draft"
    generating = "generating"
    ready = "ready"
    scheduled = "scheduled"
    sent = "sent"

class WorkshopOut(BaseModel):
    id: str
    name: str
    status: WorkshopStatus
    created_at: datetime
    scheduled_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    template_path: Optional[str] = None
    layout_json: Optional[dict] = None
    email_subject: Optional[str] = None
