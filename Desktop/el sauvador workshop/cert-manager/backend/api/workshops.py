from fastapi import APIRouter, HTTPException
from db.client import get_supabase

router = APIRouter()

@router.get("/workshops/{workshop_id}")
async def get_workshop(workshop_id: str):
    db = get_supabase()
    res = db.table("workshops").select("*").eq("id", workshop_id).single().execute()
    if not res.data:
        raise HTTPException(404, "Workshop not found")
    return res.data

@router.get("/workshops/{workshop_id}/progress")
async def get_progress(workshop_id: str):
    db = get_supabase()
    total_res = db.table("participants").select("id", count="exact").eq("workshop_id", workshop_id).execute()
    done_res = db.table("participants").select("id", count="exact").eq("workshop_id", workshop_id).not_.is_("certificate_url", "null").execute()
    return {"total": total_res.count or 0, "done": done_res.count or 0}
