# agents/analyst.py
# Same pattern as researcher.py — prompt | llm | parser
# The difference: this prompt takes {research} as input instead of {topic}

from langchain_anthropic import ChatAnthropic
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from state import ResearchState

ANALYST_PROMPT = """You are a senior business analyst.

Based on the research below, write a concise SWOT analysis.

RESEARCH:
{research}

Write the SWOT analysis in this format:

**Strengths:**
- [2-3 bullet points about internal advantages]

**Weaknesses:**
- [2-3 bullet points about internal limitations]

**Opportunities:**
- [2-3 bullet points about external growth potential]

**Threats:**
- [2-3 bullet points about external risks]

Be specific. Each bullet point should reference something from the research."""


def analyst(state: ResearchState) -> dict:
    llm = ChatAnthropic(model="claude-haiku-4-5-20251001")
    prompt = ChatPromptTemplate.from_template(ANALYST_PROMPT)
    chain = prompt | llm | StrOutputParser()

    # Read from state.research (written by the Researcher agent)
    analysis = chain.invoke({"research": state["research"]})

    return {"analysis": analysis}
