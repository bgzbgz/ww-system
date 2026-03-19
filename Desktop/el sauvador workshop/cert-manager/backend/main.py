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
from services.scheduler import start_scheduler

app = FastAPI(title="Cert Manager API")

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
    """Seed the default certificate template into the database if not present.

    Full implementation in Task 8. This is a stub for now.
    """
    pass


@app.on_event("startup")
async def on_startup():
    start_scheduler()
    _seed_default_template()


# ---------------------------------------------------------------------------
# Serve React frontend (production)
# ---------------------------------------------------------------------------
DIST_DIR = Path(__file__).parent.parent / "frontend" / "dist"

if DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str):
        """Return index.html for all non-API, non-asset paths (SPA routing)."""
        index = DIST_DIR / "index.html"
        return FileResponse(str(index))
