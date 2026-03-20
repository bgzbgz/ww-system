"""
Tests for the webhook sender service.
All network calls are mocked — no real HTTP requests made.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from services.webhook_sender import send_workshop_emails, send_single_email, _post_to_webhook


# ---------------------------------------------------------------------------
# _post_to_webhook
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_post_to_webhook_marks_sent_on_success():
    mock_db = MagicMock()
    mock_resp = MagicMock(status_code=200)
    mock_client = AsyncMock()
    mock_client.post.return_value = mock_resp

    payload = {
        "participant_id": "p-1",
        "email": "test@example.com",
        "full_name": "Test Person",
        "first_name": "Test",
        "company": "TestCo",
        "certificate_url": "https://example.com/cert.pdf",
        "workshop_id": "w-1",
        "workshop_name": "Workshop",
    }

    with patch("services.webhook_sender.get_supabase", return_value=mock_db), \
         patch("services.webhook_sender._get_webhook_url", return_value="https://n8n.example.com/webhook"):
        await _post_to_webhook(mock_client, payload)

    update_call = mock_db.table.return_value.update.call_args[0][0]
    assert update_call["email_status"] == "sent"
    assert "email_sent_at" in update_call


@pytest.mark.asyncio
async def test_post_to_webhook_marks_failed_on_http_error():
    mock_db = MagicMock()
    mock_resp = MagicMock(status_code=500, text="Internal Server Error")
    mock_client = AsyncMock()
    mock_client.post.return_value = mock_resp

    payload = {
        "participant_id": "p-1",
        "email": "test@example.com",
        "full_name": "Test Person",
        "first_name": "Test",
        "company": "TestCo",
        "certificate_url": "https://example.com/cert.pdf",
        "workshop_id": "w-1",
        "workshop_name": "Workshop",
    }

    with patch("services.webhook_sender.get_supabase", return_value=mock_db), \
         patch("services.webhook_sender._get_webhook_url", return_value="https://n8n.example.com/webhook"):
        await _post_to_webhook(mock_client, payload)

    update_call = mock_db.table.return_value.update.call_args[0][0]
    assert update_call["email_status"] == "failed"
    assert "500" in update_call["email_error"]


@pytest.mark.asyncio
async def test_post_to_webhook_marks_failed_on_network_error():
    mock_db = MagicMock()
    mock_client = AsyncMock()
    mock_client.post.side_effect = Exception("Connection refused")

    payload = {
        "participant_id": "p-1",
        "email": "test@example.com",
        "full_name": "Test Person",
        "first_name": "Test",
        "company": "TestCo",
        "certificate_url": "https://example.com/cert.pdf",
        "workshop_id": "w-1",
        "workshop_name": "Workshop",
    }

    with patch("services.webhook_sender.get_supabase", return_value=mock_db), \
         patch("services.webhook_sender._get_webhook_url", return_value="https://n8n.example.com/webhook"):
        await _post_to_webhook(mock_client, payload)

    update_call = mock_db.table.return_value.update.call_args[0][0]
    assert update_call["email_status"] == "failed"
    assert "Connection refused" in update_call["email_error"]


# ---------------------------------------------------------------------------
# send_workshop_emails
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_send_workshop_emails_raises_when_no_webhook_url():
    with patch("services.webhook_sender._get_webhook_url", return_value=""):
        with pytest.raises(RuntimeError, match="N8N_WEBHOOK_URL"):
            await send_workshop_emails("w-1")


@pytest.mark.asyncio
async def test_send_workshop_emails_skips_participants_without_cert():
    mock_db = MagicMock()
    mock_db.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = [
        {"name": "Test Workshop"}
    ]
    # One participant without certificate_url
    mock_db.table.return_value.select.return_value.eq.return_value.neq.return_value.not_.is_.return_value.execute.return_value.data = [
        {"id": "p-1", "email": "a@a.com", "full_name": "Person A", "first_name": "Person",
         "company": "Co", "certificate_url": None}
    ]

    with patch("services.webhook_sender._get_webhook_url", return_value="https://n8n.example.com/webhook"), \
         patch("services.webhook_sender.get_supabase", return_value=mock_db), \
         patch("services.webhook_sender._post_to_webhook", new_callable=AsyncMock) as mock_post:
        await send_workshop_emails("w-1")

    # Should not have posted since certificate_url is None
    mock_post.assert_not_called()
