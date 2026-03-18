# tests/test_researcher.py
# unittest.mock lets us fake (mock) external dependencies like API calls.
# This means our tests run fast and don't cost money.
#
# IMPORTANT — how LangChain mocking works:
# When you use the pipe operator (prompt | llm | parser), LangChain detects
# that MagicMock is not a Runnable subclass and wraps it in a RunnableLambda.
# RunnableLambda calls it as a plain function: mock_instance(input).
# So we set mock_instance.return_value (not mock_instance.invoke.return_value)
# to a plain string — StrOutputParser then passes it through unchanged.
from unittest.mock import patch, MagicMock
from state import ResearchState
from agents.researcher import researcher


def test_researcher_returns_research_key():
    fake_content = "Q1: What is Tesla?\nA1: Electric vehicle company."

    # patch() temporarily replaces ChatAnthropic with a fake version
    # "agents.researcher.ChatAnthropic" means: in the researcher.py file,
    # replace the ChatAnthropic import with our mock
    with patch("agents.researcher.ChatAnthropic") as MockLLM:
        mock_instance = MagicMock()
        mock_instance.return_value = fake_content  # called as function by LCEL
        MockLLM.return_value = mock_instance

        state: ResearchState = {
            "topic": "Tesla",
            "research": "",
            "analysis": "",
            "report": "",
        }

        result = researcher(state)

        # The agent should return a dict with a "research" key
        assert "research" in result
        assert result["research"] == fake_content


def test_researcher_calls_llm():
    with patch("agents.researcher.ChatAnthropic") as MockLLM:
        mock_instance = MagicMock()
        mock_instance.return_value = "Some research content"
        MockLLM.return_value = mock_instance

        state: ResearchState = {
            "topic": "Apple",
            "research": "",
            "analysis": "",
            "report": "",
        }

        researcher(state)

        # Verify the LLM was actually called (not just skipped)
        assert mock_instance.called
