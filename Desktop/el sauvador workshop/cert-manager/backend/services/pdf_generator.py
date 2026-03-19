import os
import re
import subprocess
import tempfile
import asyncio
from datetime import datetime
from db.client import get_supabase


def hydrate_template(html: str, **kwargs) -> str:
    """Replace {{token}} placeholders with actual values."""
    for key, value in kwargs.items():
        html = html.replace(f"{{{{{key}}}}}", str(value))
    return html


def apply_layout(html: str, layout: dict) -> str:
    """Inject inline styles onto each text block based on layout_json."""
    for field, props in layout.items():
        weight = "bold" if props.get("bold") else "normal"
        style = (
            f"position: absolute; "
            f"left: {props['x']}; "
            f"top: {props['y']}; "
            f"font-family: {props['font']}; "
            f"font-size: {props['size']}px; "
            f"color: {props['color']}; "
            f"font-weight: {weight}; "
            f"font-style: {'italic' if props.get('italic') else 'normal'};"
        )
        html = re.sub(
            rf'<span id="{field}"([^>]*)>',
            f'<span id="{field}" style="{style}"\\1>',
            html,
        )
    return html


def render_to_pdf(html_content: str, output_path: str) -> None:
    """Write HTML to a temp file and call render.js via subprocess."""
    render_js = os.path.join(os.path.dirname(__file__), "..", "render.js")
    with tempfile.NamedTemporaryFile(mode="w", suffix=".html", delete=False, encoding="utf-8") as f:
        f.write(html_content)
        tmp_html = f.name
    try:
        result = subprocess.run(
            ["node", render_js, tmp_html, output_path],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode != 0:
            raise RuntimeError(f"Puppeteer failed: {result.stderr}")
    finally:
        try:
            os.unlink(tmp_html)
        except OSError:
            pass


async def generate_workshop_pdfs(workshop_id: str) -> None:
    """Generate PDFs for all participants in a workshop (max 5 concurrent)."""
    db = get_supabase()

    # Load workshop + template
    res = db.table("workshops").select("*").eq("id", workshop_id).limit(1).execute()
    if not res.data:
        raise RuntimeError(f"Workshop {workshop_id} not found")
    workshop = res.data[0]

    template_bytes = db.storage.from_("templates").download(workshop["template_path"])
    template_html = template_bytes.decode("utf-8")
    layout = workshop.get("layout_json") or {}

    participants = db.table("participants").select("*").eq("workshop_id", workshop_id).execute().data
    date_str = datetime.now().strftime("%B %Y")

    semaphore = asyncio.Semaphore(5)

    async def process_one(p: dict) -> None:
        async with semaphore:
            html = hydrate_template(
                template_html,
                full_name=p["full_name"],
                first_name=p["first_name"],
                company=p["company"],
                date=date_str,
            )
            html = apply_layout(html, layout)
            storage_path = f"certificates/{workshop_id}/{p['id']}.pdf"
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
                pdf_path = f.name
            try:
                await asyncio.get_running_loop().run_in_executor(
                    None, render_to_pdf, html, pdf_path
                )
                with open(pdf_path, "rb") as f:
                    pdf_bytes = f.read()
                db.storage.from_("certificates").upload(
                    storage_path,
                    pdf_bytes,
                    {"content-type": "application/pdf", "upsert": "true"},
                )
                public_url = db.storage.from_("certificates").get_public_url(storage_path)
                db.table("participants").update({"certificate_url": public_url}).eq("id", p["id"]).execute()
            finally:
                try:
                    os.unlink(pdf_path)
                except OSError:
                    pass

    await asyncio.gather(*[process_one(p) for p in participants])
    db.table("workshops").update({"status": "ready"}).eq("id", workshop_id).execute()
