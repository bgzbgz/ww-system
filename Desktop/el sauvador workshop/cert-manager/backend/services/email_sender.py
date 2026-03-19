import os
import asyncio
import base64
import httpx
from datetime import datetime, timezone
from db.client import get_supabase


def hydrate_email_subject(template: str, first_name: str) -> str:
    return template.replace("{{first_name}}", first_name)


def hydrate_email_body(template: str, **kwargs) -> str:
    for key, value in kwargs.items():
        template = template.replace(f"{{{{{key}}}}}", str(value))
    return template


async def _get_access_token() -> str:
    db = get_supabase()
    res = db.table("oauth_tokens").select("refresh_token").eq("provider", "microsoft").limit(1).execute()
    if not res.data:
        raise RuntimeError("Microsoft account not connected. Visit /auth/login first.")
    row = res.data[0]

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"https://login.microsoftonline.com/{os.environ['MS_TENANT_ID']}/oauth2/v2.0/token",
            data={
                "client_id": os.environ["MS_CLIENT_ID"],
                "client_secret": os.environ["MS_CLIENT_SECRET"],
                "grant_type": "refresh_token",
                "refresh_token": row["refresh_token"],
                "scope": "https://graph.microsoft.com/Mail.Send offline_access",
            }
        )
        tokens = resp.json()
        if "error" in tokens:
            raise RuntimeError(f"Token refresh failed: {tokens.get('error_description')}")

    # Rotate refresh token
    db.table("oauth_tokens").update({
        "refresh_token": tokens["refresh_token"],
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("provider", "microsoft").execute()

    return tokens["access_token"]


async def send_workshop_emails(workshop_id: str) -> None:
    db = get_supabase()

    res = db.table("workshops").select("*").eq("id", workshop_id).limit(1).execute()
    if not res.data:
        raise RuntimeError(f"Workshop {workshop_id} not found")
    workshop = res.data[0]

    participants = (
        db.table("participants").select("*")
        .eq("workshop_id", workshop_id)
        .neq("email_status", "sent")
        .not_.is_("email", "null")
        .execute().data
    )

    email_body_path = workshop.get("email_body_path") or "email_body.html"
    email_body_template = db.storage.from_("templates").download(email_body_path).decode("utf-8")

    access_token = await _get_access_token()

    async with httpx.AsyncClient(timeout=30) as client:
        for p in participants:
            if not p.get("certificate_url"):
                continue

            subject = hydrate_email_subject(
                workshop.get("email_subject") or "Your Fast Track Certificate, {{first_name}}",
                p["first_name"],
            )
            body = hydrate_email_body(
                email_body_template,
                first_name=p["first_name"],
                full_name=p["full_name"],
                company=p["company"],
                certificate_url=p["certificate_url"],
            )

            # Download PDF from certificates/ bucket
            pdf_bytes = db.storage.from_("certificates").download(
                f"certificates/{workshop_id}/{p['id']}.pdf"
            )
            pdf_b64 = base64.b64encode(pdf_bytes).decode()

            message = {
                "message": {
                    "subject": subject,
                    "body": {"contentType": "HTML", "content": body},
                    "toRecipients": [{"emailAddress": {"address": p["email"]}}],
                    "attachments": [{
                        "@odata.type": "#microsoft.graph.fileAttachment",
                        "name": f"{p['full_name'].replace(' ', '_')}_Certificate.pdf",
                        "contentType": "application/pdf",
                        "contentBytes": pdf_b64,
                    }],
                }
            }

            for attempt in range(3):
                resp = await client.post(
                    "https://graph.microsoft.com/v1.0/me/sendMail",
                    json=message,
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                if resp.status_code == 202:
                    db.table("participants").update({
                        "email_status": "sent",
                        "email_sent_at": datetime.now(timezone.utc).isoformat(),
                    }).eq("id", p["id"]).execute()
                    break
                elif resp.status_code == 429:
                    retry_after = int(resp.headers.get("Retry-After", 10))
                    await asyncio.sleep(min(retry_after * (2 ** attempt), 60))
                else:
                    db.table("participants").update({
                        "email_status": "failed",
                        "email_error": f"HTTP {resp.status_code}: {resp.text[:200]}",
                    }).eq("id", p["id"]).execute()
                    break
            else:
                db.table("participants").update({
                    "email_status": "failed",
                    "email_error": "Rate limited — max retries exceeded",
                }).eq("id", p["id"]).execute()

            await asyncio.sleep(2)  # Rate limit buffer

    db.table("workshops").update({
        "status": "sent",
        "sent_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", workshop_id).execute()


async def send_single_email(participant_id: str, workshop_id: str) -> None:
    """Re-send email for one specific participant."""
    db = get_supabase()

    res_w = db.table("workshops").select("*").eq("id", workshop_id).limit(1).execute()
    if not res_w.data:
        return
    workshop = res_w.data[0]

    res_p = db.table("participants").select("*").eq("id", participant_id).limit(1).execute()
    if not res_p.data:
        return
    p = res_p.data[0]

    if not p.get("certificate_url"):
        return

    email_body_path = workshop.get("email_body_path") or "email_body.html"
    email_body_template = db.storage.from_("templates").download(email_body_path).decode("utf-8")
    access_token = await _get_access_token()

    subject = hydrate_email_subject(
        workshop.get("email_subject") or "Your Fast Track Certificate, {{first_name}}",
        p["first_name"],
    )
    body = hydrate_email_body(
        email_body_template,
        first_name=p["first_name"],
        full_name=p["full_name"],
        company=p["company"],
        certificate_url=p["certificate_url"],
    )
    pdf_bytes = db.storage.from_("certificates").download(
        f"certificates/{workshop_id}/{p['id']}.pdf"
    )
    pdf_b64 = base64.b64encode(pdf_bytes).decode()

    message = {
        "message": {
            "subject": subject,
            "body": {"contentType": "HTML", "content": body},
            "toRecipients": [{"emailAddress": {"address": p["email"]}}],
            "attachments": [{
                "@odata.type": "#microsoft.graph.fileAttachment",
                "name": f"{p['full_name'].replace(' ', '_')}_Certificate.pdf",
                "contentType": "application/pdf",
                "contentBytes": pdf_b64,
            }],
        }
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://graph.microsoft.com/v1.0/me/sendMail",
            json=message,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if resp.status_code == 202:
            db.table("participants").update({
                "email_status": "sent",
                "email_sent_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", participant_id).execute()
        else:
            db.table("participants").update({
                "email_status": "failed",
                "email_error": f"HTTP {resp.status_code}: {resp.text[:200]}",
            }).eq("id", participant_id).execute()
