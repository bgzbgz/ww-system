"""
Tests for the email send API endpoint.
No real DB or HTTP calls — everything is mocked.
"""
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient


def make_client(mock_db):
    import sys
    for mod in list(sys.modules.keys()):
        if "api." in mod or mod in ("main",):
            sys.modules.pop(mod, None)
    with patch("db.client.get_supabase", return_value=mock_db):
        from main import app
        return TestClient(app)


def _db_returning(workshop_row, participants=None):
    """Build a mock Supabase client for send-endpoint tests."""
    mock_db = MagicMock()

    def table_side_effect(name):
        tbl = MagicMock()
        if name == "workshops":
            tbl.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = [workshop_row]
            tbl.update.return_value.eq.return_value.execute.return_value = MagicMock()
        elif name == "participants":
            tbl.select.return_value.eq.return_value.neq.return_value.execute.return_value.data = participants or []
            tbl.update.return_value.eq.return_value.execute.return_value = MagicMock()
        return tbl

    mock_db.table.side_effect = table_side_effect
    return mock_db


def test_send_returns_404_for_unknown_workshop():
    mock_db = MagicMock()
    mock_db.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = []
    client = make_client(mock_db)
    resp = client.post("/api/workshops/no-such-id/send")
    assert resp.status_code == 404


def test_send_returns_400_if_certs_not_generated():
    mock_db = _db_returning({"status": "draft", "name": "Test Workshop"})
    client = make_client(mock_db)
    resp = client.post("/api/workshops/w-1/send")
    assert resp.status_code == 400
    assert "generated" in resp.json()["detail"].lower()


def test_send_returns_500_when_webhook_url_missing():
    mock_db = _db_returning({"status": "ready", "name": "Test Workshop"})
    client = make_client(mock_db)
    with patch("os.environ.get", side_effect=lambda k, d="": "" if k == "N8N_WEBHOOK_URL" else d):
        resp = client.post("/api/workshops/w-1/send")
    assert resp.status_code == 500


def test_send_returns_ok_and_processes_participants():
    participants = [
        {
            "id": "p-1",
            "email": "a@example.com",
            "full_name": "Ana García",
            "first_name": "Ana",
            "company": "TestCo",
            "certificate_url": "https://example.com/cert.pdf",
        }
    ]
    mock_db = _db_returning({"status": "ready", "name": "Test Workshop"}, participants)
    client = make_client(mock_db)

    with patch("api.email.os.environ.get", return_value="https://n8n.example.com/webhook"), \
         patch("httpx.AsyncClient") as mock_http:
        mock_resp = MagicMock(status_code=200)
        mock_http.return_value.__aenter__.return_value.post = AsyncMock(return_value=mock_resp)
        resp = client.post("/api/workshops/w-1/send")

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert resp.json()["processed"] == 1


def test_send_skips_participants_missing_email_or_cert():
    participants = [
        {"id": "p-1", "email": "", "full_name": "No Email", "first_name": "No",
         "company": "Co", "certificate_url": "https://example.com/cert.pdf"},
        {"id": "p-2", "email": "b@example.com", "full_name": "No Cert", "first_name": "No",
         "company": "Co", "certificate_url": None},
    ]
    mock_db = _db_returning({"status": "ready", "name": "Test"}, participants)
    client = make_client(mock_db)

    with patch("api.email.os.environ.get", return_value="https://n8n.example.com/webhook"), \
         patch("httpx.AsyncClient") as mock_http:
        mock_resp = MagicMock(status_code=200)
        mock_http.return_value.__aenter__.return_value.post = AsyncMock(return_value=mock_resp)
        resp = client.post("/api/workshops/w-1/send")

    assert resp.status_code == 200
    assert resp.json()["processed"] == 2  # counted but skipped in loop
