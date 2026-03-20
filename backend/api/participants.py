from fastapi import APIRouter, HTTPException
from db.client import get_supabase
from models.participant import ParticipantUpdate
import re
from collections import Counter

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
router = APIRouter()

@router.get("/workshops/{workshop_id}/participants")
async def list_participants(workshop_id: str):
    db = get_supabase()
    res = db.table("participants").select("*").eq("workshop_id", workshop_id).execute()
    rows = res.data or []
    name_counts = Counter(r["full_name"] for r in rows)
    for r in rows:
        if name_counts[r["full_name"]] > 1:
            r["warning"] = "duplicate_name"
        elif not r.get("email"):
            r["warning"] = "missing_email"
        elif not EMAIL_RE.match(r["email"]):
            r["warning"] = "invalid_email"
        else:
            r["warning"] = None
    return rows

@router.patch("/participants/{participant_id}")
async def update_participant(participant_id: str, body: ParticipantUpdate):
    db = get_supabase()
    updates = body.model_dump(exclude_none=True)
    if "full_name" in updates:
        updates["first_name"] = updates["full_name"].split()[0]
    res = db.table("participants").update(updates).eq("id", participant_id).execute()
    if not res.data:
        raise HTTPException(404, "Participant not found")
    return res.data[0]

@router.delete("/participants/{participant_id}")
async def delete_participant(participant_id: str):
    db = get_supabase()
    db.table("participants").delete().eq("id", participant_id).execute()
    return {"ok": True}
