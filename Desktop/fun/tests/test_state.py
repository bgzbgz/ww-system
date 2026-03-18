# tests/test_state.py
# In Python, we import things we need at the top of every file.
# "from X import Y" means: from file X, get thing Y.
from state import ResearchState


def test_state_has_all_required_fields():
    # TypedDict is like a typed JavaScript object / n8n JSON node
    # We create one by filling in all fields
    state: ResearchState = {
        "topic": "Tesla",
        "research": "",
        "analysis": "",
        "report": "",
    }
    assert state["topic"] == "Tesla"
    assert state["research"] == ""
    assert state["analysis"] == ""
    assert state["report"] == ""


def test_state_can_be_updated_with_spread():
    # In Python, {**existing, "key": "new_value"} is like
    # JavaScript's { ...existing, key: "new_value" }
    state: ResearchState = {
        "topic": "Tesla",
        "research": "",
        "analysis": "",
        "report": "",
    }
    updated = {**state, "research": "Q1: What is Tesla?\nA1: An EV company."}
    assert updated["research"] == "Q1: What is Tesla?\nA1: An EV company."
    assert updated["topic"] == "Tesla"  # other fields unchanged
