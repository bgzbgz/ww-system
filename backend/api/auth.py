import os
import httpx
from fastapi import APIRouter
from fastapi.responses import RedirectResponse
from db.client import get_supabase
from datetime import datetime, timezone

router = APIRouter(prefix="/auth")

SCOPES = "https://graph.microsoft.com/Mail.Send offline_access"


def _auth_params():
    return {
        "client_id": os.environ["MS_CLIENT_ID"],
        "client_secret": os.environ["MS_CLIENT_SECRET"],
        "tenant_id": os.environ["MS_TENANT_ID"],
    }


@router.get("/login")
async def login():
    p = _auth_params()
    redirect_uri = os.environ.get("MS_REDIRECT_URI", "http://localhost:8000/auth/callback")
    url = (
        f"https://login.microsoftonline.com/{p['tenant_id']}/oauth2/v2.0/authorize"
        f"?client_id={p['client_id']}"
        f"&response_type=code"
        f"&redirect_uri={redirect_uri}"
        f"&scope={SCOPES.replace(' ', '%20')}"
        f"&response_mode=query"
    )
    return RedirectResponse(url)


@router.get("/callback")
async def callback(code: str):
    p = _auth_params()
    redirect_uri = os.environ.get("MS_REDIRECT_URI", "http://localhost:8000/auth/callback")
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"https://login.microsoftonline.com/{p['tenant_id']}/oauth2/v2.0/token",
            data={
                "client_id": p["client_id"],
                "client_secret": p["client_secret"],
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri,
                "scope": SCOPES,
            }
        )
        tokens = resp.json()

    db = get_supabase()
    db.table("oauth_tokens").upsert({
        "provider": "microsoft",
        "refresh_token": tokens["refresh_token"],
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).execute()

    return {"message": "Microsoft account connected. You can close this tab."}
