from datetime import datetime
from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse
from db.client import get_supabase

router = APIRouter()

@router.get("/workshops/{workshop_id}")
async def get_workshop(workshop_id: str):
    db = get_supabase()
    res = db.table("workshops").select("*").eq("id", workshop_id).limit(1).execute()
    if not res.data:
        raise HTTPException(404, "Workshop not found")
    return res.data[0]

@router.get("/workshops/{workshop_id}/cert-preview", response_class=HTMLResponse)
async def cert_preview_html(workshop_id: str, full_name: str = "Sample Name"):
    db = get_supabase()
    res = db.table("workshops").select("template_path").eq("id", workshop_id).limit(1).execute()
    if not res.data:
        raise HTTPException(404, "Workshop not found")
    template_path = res.data[0].get("template_path") or "certificate_base.html"
    template_bytes = db.storage.from_("templates").download(template_path)
    html = template_bytes.decode("utf-8")
    date_str = "[EL SALVADOR, " + datetime.now().strftime("%b %Y").upper() + "]"
    html = (html
        .replace("{{full_name}}", full_name)
        .replace("{{first_name}}", full_name.split()[0] if full_name else "")
        .replace("{{company}}", "")
        .replace("{{date}}", date_str)
    )
    return HTMLResponse(html)


@router.get("/workshops/{workshop_id}/progress")
async def get_progress(workshop_id: str):
    db = get_supabase()
    total_res = db.table("participants").select("id", count="exact").eq("workshop_id", workshop_id).execute()
    done_res = db.table("participants").select("id", count="exact").eq("workshop_id", workshop_id).not_.is_("certificate_url", "null").execute()
    return {"total": total_res.count or 0, "done": done_res.count or 0}
