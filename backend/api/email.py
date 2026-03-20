import os
import httpx
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from db.client import get_supabase
from services.webhook_sender import send_single_email

router = APIRouter()


@router.post("/workshops/{workshop_id}/send")
async def send_now(workshop_id: str):
    db = get_supabase()
    res = db.table("workshops").select("status, name").eq("id", workshop_id).limit(1).execute()
    if not res.data:
        raise HTTPException(404, "Workshop not found")
    if res.data[0]["status"] not in ("ready", "scheduled", "sent"):
        raise HTTPException(400, "Certificates must be generated before sending")
    webhook_url = os.environ.get("N8N_WEBHOOK_URL", "")
    if not webhook_url:
        raise HTTPException(500, "N8N_WEBHOOK_URL not set")
    participants = (
        db.table("participants").select("*")
        .eq("workshop_id", workshop_id)
        .neq("email_status", "sent")
        .execute().data
    )
    workshop_name = res.data[0].get("name", "")
    async with httpx.AsyncClient() as client:
        for p in participants:
            if not p.get("certificate_url") or not p.get("email"):
                continue
            payload = {
                "participant_id": p["id"],
                "email": p["email"],
                "full_name": p["full_name"],
                "first_name": p.get("first_name") or p["full_name"].split()[0],
                "company": p.get("company", ""),
                "certificate_url": p["certificate_url"],
                "workshop_id": workshop_id,
                "workshop_name": workshop_name,
            }
            try:
                resp = await client.post(webhook_url, json=payload, timeout=30)
                status = "sent" if resp.status_code < 300 else "failed"
                err = None if resp.status_code < 300 else f"HTTP {resp.status_code}"
            except Exception as exc:
                status = "failed"
                err = str(exc)[:200]
            db.table("participants").update({
                "email_status": status,
                "email_error": err,
                "email_sent_at": datetime.now(timezone.utc).isoformat() if status == "sent" else None,
            }).eq("id", p["id"]).execute()
    db.table("workshops").update({"status": "sent"}).eq("id", workshop_id).execute()
    return {"ok": True, "processed": len(participants), "webhook_url": webhook_url[:40]}


@router.post("/participants/{participant_id}/retry")
async def retry_email(participant_id: str):
    db = get_supabase()
    res = db.table("participants").select("workshop_id").eq("id", participant_id).limit(1).execute()
    if not res.data:
        raise HTTPException(404, "Participant not found")
    p = res.data[0]
    db.table("participants").update({"email_status": "pending", "email_error": None}).eq("id", participant_id).execute()
    await send_single_email(participant_id, p["workshop_id"])
    return {"ok": True}
