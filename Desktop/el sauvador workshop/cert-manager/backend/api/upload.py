import os
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException
from services.excel_parser import parse_excel, ExcelParseError
from db.client import get_supabase

router = APIRouter()

@router.post("/upload")
async def upload_excel(file: UploadFile = File(...)):
    suffix = ".xlsx" if file.filename.endswith(".xlsx") else ".xls"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        contents = await file.read()
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        rows = parse_excel(tmp_path)
    except ExcelParseError as e:
        raise HTTPException(status_code=422, detail=str(e))
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass  # Windows may hold the file lock briefly; safe to ignore

    db = get_supabase()

    workshop_name = file.filename.replace(".xlsx", "").replace(".xls", "")
    workshop_res = db.table("workshops").insert({"name": workshop_name}).execute()
    workshop = workshop_res.data[0]
    workshop_id = workshop["id"]

    participant_rows = [
        {
            "workshop_id": workshop_id,
            "first_name": r["first_name"],
            "full_name": r["full_name"],
            "email": r["email"] or None,
            "company": r["company"],
            "position": r["position"] or None,
        }
        for r in rows
    ]
    if participant_rows:
        db.table("participants").insert(participant_rows).execute()

    warning_count = sum(1 for r in rows if r.get("warning"))

    return {
        "workshop_id": workshop_id,
        "participant_count": len(rows),
        "warning_count": warning_count,
    }
