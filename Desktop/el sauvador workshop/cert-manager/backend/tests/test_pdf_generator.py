import pytest
from services.pdf_generator import hydrate_template, apply_layout

SAMPLE_TEMPLATE = """
<html><body>
<span id="full_name">{{full_name}}</span>
<span id="company">{{company}}</span>
<span id="date">{{date}}</span>
</body></html>
"""

SAMPLE_LAYOUT = {
    "full_name": {"x": "42%", "y": "38%", "font": "Montserrat", "size": 36, "color": "#1a1a1a", "bold": True, "italic": False},
    "company":   {"x": "42%", "y": "48%", "font": "Montserrat", "size": 18, "color": "#555555", "bold": False, "italic": False},
    "date":      {"x": "42%", "y": "58%", "font": "Montserrat", "size": 14, "color": "#888888", "bold": False, "italic": False},
}

def test_hydrate_replaces_tokens():
    result = hydrate_template(SAMPLE_TEMPLATE, full_name="María García", company="Banco Agrícola", date="March 2026")
    assert "María García" in result
    assert "Banco Agrícola" in result
    assert "March 2026" in result
    assert "{{full_name}}" not in result

def test_apply_layout_injects_inline_styles():
    html = hydrate_template(SAMPLE_TEMPLATE, full_name="Test", company="Co", date="2026")
    result = apply_layout(html, SAMPLE_LAYOUT)
    assert "position: absolute" in result
    assert "left: 42%" in result
    assert "top: 38%" in result
    assert "font-size: 36px" in result
    assert "font-weight: bold" in result
    assert "color: #1a1a1a" in result
