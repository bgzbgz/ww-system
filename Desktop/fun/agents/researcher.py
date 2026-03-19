# agents/researcher.py
# LangChain's three building blocks:
# 1. ChatPromptTemplate  — defines what we ask the LLM
# 2. ChatAnthropic       — the Claude LLM model
# 3. StrOutputParser     — extracts the text from Claude's response
#
# We connect them with | (pipe) just like piping commands in a terminal:
#   prompt | llm | parser
# This creates a "chain" that processes data left to right.

from langchain_anthropic import ChatAnthropic
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from state import ResearchState

# The prompt template — {topic} is a placeholder filled in at runtime
RESEARCHER_PROMPT = """You are a business researcher.

Your topic is: {topic}

Generate exactly 4 key research questions about this topic, then answer each one
with 2-3 sentences based on your knowledge.

Format your response EXACTLY like this:
Q1: [your question]
A1: [your answer]

Q2: [your question]
A2: [your answer]

Q3: [your question]
A3: [your answer]

Q4: [your question]
A4: [your answer]"""


def researcher(state: ResearchState) -> dict:
    # Create the LLM — we use Haiku because it's fast and cost-effective for learning
    llm = ChatAnthropic(model="claude-haiku-4-5-20251001")

    # Build the prompt template
    prompt = ChatPromptTemplate.from_template(RESEARCHER_PROMPT)

    # Connect prompt → llm → parser with the pipe operator
    # This is a LangChain "chain" — data flows left to right
    chain = prompt | llm | StrOutputParser()

    # Run the chain with our topic filled into the {topic} placeholder
    research = chain.invoke({"topic": state["topic"]})

    # Return only the fields we're updating — LangGraph merges this into the state
    return {"research": research}
