from fastapi import APIRouter, BackgroundTasks, HTTPException
from db.client import get_supabase
from services.pdf_generator import generate_workshop_pdfs

router = APIRouter()


@router.post("/workshops/{workshop_id}/generate")
async def trigger_generate(workshop_id: str, background_tasks: BackgroundTasks):
    db = get_supabase()
    res = db.table("workshops").select("status, template_path").eq("id", workshop_id).limit(1).execute()
    if not res.data:
        raise HTTPException(404, "Workshop not found")
    workshop = res.data[0]

    # Set default template if none chosen
    if not workshop.get("template_path"):
        db.table("workshops").update({"template_path": "certificate_base.html"}).eq("id", workshop_id).execute()

    # Mark as generating
    db.table("workshops").update({"status": "generating"}).eq("id", workshop_id).execute()

    background_tasks.add_task(generate_workshop_pdfs, workshop_id)
    return {"ok": True, "message": "Generation started"}


@router.patch("/workshops/{workshop_id}/layout")
async def save_layout(workshop_id: str, body: dict):
    db = get_supabase()
    db.table("workshops").update({"layout_json": body.get("layout_json")}).eq("id", workshop_id).execute()
    return {"ok": True}
