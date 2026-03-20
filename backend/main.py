import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from api.upload import router as upload_router
from api.workshops import router as workshops_router
from api.participants import router as participants_router
from api.generate import router as generate_router
from api.email import router as email_router
from api.auth import router as auth_router

app = FastAPI(title="Cert Manager API")


@app.get("/debug/env", include_in_schema=False)
async def debug_env():
    return {
        "N8N_WEBHOOK_URL": bool(os.environ.get("N8N_WEBHOOK_URL")),
        "N8N_WEBHOOK_URL_value_start": os.environ.get("N8N_WEBHOOK_URL", "")[:20],
        "SUPABASE_URL": bool(os.environ.get("SUPABASE_URL")),
        "SUPABASE_SERVICE_KEY": bool(os.environ.get("SUPABASE_SERVICE_KEY")),
    }

# ---------------------------------------------------------------------------
# Auth routes (no /api prefix — mounted at /auth via router prefix)
# ---------------------------------------------------------------------------
app.include_router(auth_router)

# ---------------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------------
app.include_router(upload_router, prefix="/api")
app.include_router(workshops_router, prefix="/api")
app.include_router(participants_router, prefix="/api")
app.include_router(generate_router, prefix="/api")
app.include_router(email_router, prefix="/api")


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------

def _seed_default_template():
    """Upload default certificate template to Supabase Storage if not already present."""
    from db.client import get_supabase
    db = get_supabase()
    template_path = os.path.join(os.path.dirname(__file__), "templates", "certificate_base.html")
    try:
        db.storage.from_("templates").download("certificate_base.html")
        # Already exists — nothing to do
    except Exception:
        with open(template_path, "rb") as f:
            db.storage.from_("templates").upload(
                "certificate_base.html",
                f.read(),
                {"content-type": "text/html", "upsert": "true"},
            )


@app.on_event("startup")
async def on_startup():
    _seed_default_template()


# ---------------------------------------------------------------------------
# Serve React frontend (production)
# ---------------------------------------------------------------------------
DIST_DIR = Path(__file__).parent.parent / "frontend" / "dist"

if DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="assets")
    if (DIST_DIR / "fonts").exists():
        app.mount("/fonts", StaticFiles(directory=str(DIST_DIR / "fonts")), name="fonts")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str):
        """Return index.html for all non-API, non-asset paths (SPA routing)."""
        index = DIST_DIR / "index.html"
        return FileResponse(str(index))
