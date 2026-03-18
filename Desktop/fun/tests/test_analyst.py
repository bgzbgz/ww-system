# tests/test_analyst.py
# Same mocking pattern as test_researcher.py:
# mock_instance.return_value = "a string" because LCEL calls it as a function.
from unittest.mock import patch, MagicMock
from state import ResearchState
from agents.analyst import analyst


def test_analyst_returns_analysis_key():
    fake_content = (
        "Strengths: Strong brand\nWeaknesses: High prices\n"
        "Opportunities: Growing EV market\nThreats: Competition"
    )

    with patch("agents.analyst.ChatAnthropic") as MockLLM:
        mock_instance = MagicMock()
        mock_instance.return_value = fake_content
        MockLLM.return_value = mock_instance

        state: ResearchState = {
            "topic": "Tesla",
            "research": "Q1: What is Tesla?\nA1: An EV company.",
            "analysis": "",
            "report": "",
        }

        result = analyst(state)

        assert "analysis" in result
        assert result["analysis"] == fake_content


def test_analyst_calls_llm():
    with patch("agents.analyst.ChatAnthropic") as MockLLM:
        mock_instance = MagicMock()
        mock_instance.return_value = "SWOT analysis here"
        MockLLM.return_value = mock_instance

        state: ResearchState = {
            "topic": "Tesla",
            "research": "Some detailed research about Tesla",
            "analysis": "",
            "report": "",
        }

        analyst(state)

        assert mock_instance.called
