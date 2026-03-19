from fastapi import APIRouter, HTTPException, BackgroundTasks
from datetime import datetime
from db.client import get_supabase
from services.scheduler import schedule_send, cancel_send
from services.email_sender import send_workshop_emails, send_single_email
from pydantic import BaseModel

router = APIRouter()


class ScheduleRequest(BaseModel):
    scheduled_at: str  # ISO 8601 UTC string


@router.post("/workshops/{workshop_id}/schedule")
async def schedule_emails(workshop_id: str, body: ScheduleRequest):
    db = get_supabase()
    run_date = datetime.fromisoformat(body.scheduled_at.replace("Z", "+00:00"))
    cancel_send(workshop_id)
    schedule_send(workshop_id, run_date)
    db.table("workshops").update({
        "status": "scheduled",
        "scheduled_at": body.scheduled_at,
    }).eq("id", workshop_id).execute()
    return {"ok": True}


@router.delete("/workshops/{workshop_id}/schedule")
async def cancel_schedule(workshop_id: str):
    db = get_supabase()
    cancel_send(workshop_id)
    db.table("workshops").update({"status": "ready", "scheduled_at": None}).eq("id", workshop_id).execute()
    return {"ok": True}


@router.post("/workshops/{workshop_id}/send")
async def send_now(workshop_id: str, background_tasks: BackgroundTasks):
    db = get_supabase()
    res = db.table("workshops").select("status").eq("id", workshop_id).limit(1).execute()
    if not res.data:
        raise HTTPException(404, "Workshop not found")
    workshop = res.data[0]
    if workshop["status"] not in ("ready", "scheduled"):
        raise HTTPException(400, "Certificates must be generated before sending")
    cancel_send(workshop_id)
    db.table("workshops").update({"status": "scheduled"}).eq("id", workshop_id).execute()
    background_tasks.add_task(send_workshop_emails, workshop_id)
    return {"ok": True}


@router.post("/participants/{participant_id}/retry")
async def retry_email(participant_id: str, background_tasks: BackgroundTasks):
    db = get_supabase()
    res = db.table("participants").select("workshop_id").eq("id", participant_id).limit(1).execute()
    if not res.data:
        raise HTTPException(404, "Participant not found")
    p = res.data[0]
    db.table("participants").update({"email_status": "pending", "email_error": None}).eq("id", participant_id).execute()
    background_tasks.add_task(send_single_email, participant_id, p["workshop_id"])
    return {"ok": True}
