import os
import asyncio
import httpx
from datetime import datetime, timezone
from db.client import get_supabase


def _get_webhook_url() -> str:
    return os.environ.get("N8N_WEBHOOK_URL", "")


async def _post_to_webhook(client: httpx.AsyncClient, payload: dict) -> None:
    """POST one participant's data to the n8n webhook and update DB status."""
    db = get_supabase()
    participant_id = payload["participant_id"]
    webhook_url = _get_webhook_url()
    try:
        resp = await client.post(webhook_url, json=payload, timeout=30)
        if resp.status_code < 300:
            db.table("participants").update({
                "email_status": "sent",
                "email_sent_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", participant_id).execute()
        else:
            db.table("participants").update({
                "email_status": "failed",
                "email_error": f"Webhook returned HTTP {resp.status_code}: {resp.text[:200]}",
            }).eq("id", participant_id).execute()
    except Exception as exc:
        db.table("participants").update({
            "email_status": "failed",
            "email_error": str(exc)[:200],
        }).eq("id", participant_id).execute()


async def send_workshop_emails(workshop_id: str) -> None:
    if not _get_webhook_url():
        raise RuntimeError("N8N_WEBHOOK_URL is not set in environment variables.")

    db = get_supabase()

    res = db.table("workshops").select("name").eq("id", workshop_id).limit(1).execute()
    if not res.data:
        raise RuntimeError(f"Workshop {workshop_id} not found")
    workshop_name = res.data[0].get("name", "")

    participants = (
        db.table("participants").select("*")
        .eq("workshop_id", workshop_id)
        .neq("email_status", "sent")
        .not_.is_("email", "null")
        .execute().data
    )

    async with httpx.AsyncClient() as client:
        for p in participants:
            if not p.get("certificate_url") or not p.get("email"):
                continue
            payload = {
                "participant_id": p["id"],
                "email":          p["email"],
                "full_name":      p["full_name"],
                "first_name":     p.get("first_name") or p["full_name"].split()[0],
                "company":        p.get("company", ""),
                "certificate_url": p["certificate_url"],
                "workshop_id":    workshop_id,
                "workshop_name":  workshop_name,
            }
            await _post_to_webhook(client, payload)
            await asyncio.sleep(0.2)

    db.table("workshops").update({
        "status": "sent",
        "sent_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", workshop_id).execute()


async def send_single_email(participant_id: str, workshop_id: str) -> None:
    if not _get_webhook_url():
        raise RuntimeError("N8N_WEBHOOK_URL is not set in environment variables.")

    db = get_supabase()

    res_w = db.table("workshops").select("name").eq("id", workshop_id).limit(1).execute()
    res_p = db.table("participants").select("*").eq("id", participant_id).limit(1).execute()
    if not res_w.data or not res_p.data:
        return

    p = res_p.data[0]
    if not p.get("certificate_url") or not p.get("email"):
        return

    payload = {
        "participant_id": participant_id,
        "email":          p["email"],
        "full_name":      p["full_name"],
        "first_name":     p.get("first_name") or p["full_name"].split()[0],
        "company":        p.get("company", ""),
        "certificate_url": p["certificate_url"],
        "workshop_id":    workshop_id,
        "workshop_name":  res_w.data[0].get("name", ""),
    }

    async with httpx.AsyncClient() as client:
        await _post_to_webhook(client, payload)
