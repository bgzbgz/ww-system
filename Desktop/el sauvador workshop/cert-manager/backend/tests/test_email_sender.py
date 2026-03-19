import pytest
from services.email_sender import hydrate_email_subject, hydrate_email_body


def test_hydrate_subject_replaces_first_name():
    result = hydrate_email_subject("Your Fast Track Certificate, {{first_name}}", "María")
    assert result == "Your Fast Track Certificate, María"


def test_hydrate_body_replaces_all_tokens():
    template = "Hello {{first_name}}, from {{company}}. View: {{certificate_url}}"
    result = hydrate_email_body(
        template,
        first_name="María",
        full_name="María García",
        company="Banco Agrícola",
        certificate_url="https://example.com/cert.pdf",
    )
    assert "María" in result
    assert "Banco Agrícola" in result
    assert "https://example.com/cert.pdf" in result
    assert "{{" not in result
