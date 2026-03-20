from pydantic import BaseModel
from typing import Optional
from enum import Enum

class EmailStatus(str, Enum):
    pending = "pending"
    sent = "sent"
    failed = "failed"

class ParticipantOut(BaseModel):
    id: str
    workshop_id: str
    first_name: str
    full_name: str
    email: Optional[str] = None
    company: str
    position: Optional[str] = None
    certificate_url: Optional[str] = None
    email_status: EmailStatus
    email_error: Optional[str] = None
    warning: Optional[str] = None  # computed on read, not stored

class ParticipantUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    company: Optional[str] = None
