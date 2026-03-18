# Multi-Agent Business Research Workflow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Python multi-agent workflow that takes a company/industry name and produces a structured markdown business report, using three LangChain agents orchestrated by LangGraph, with LangSmith tracing.

**Architecture:** Three agents (Researcher → Analyst → Writer) are LangGraph nodes that share a TypedDict state. Each agent is a LangChain chain: `ChatPromptTemplate | ChatAnthropic | StrOutputParser`. LangGraph compiles them into a directed graph and runs them in sequence. LangSmith automatically traces all LLM calls when env vars are set.

**Tech Stack:** Python 3.11+, langchain, langgraph, langsmith, langchain-anthropic, python-dotenv, pytest

---

## File Map

| File | What it does |
|------|-------------|
| `requirements.txt` | All Python packages to install |
| `.env` | API keys and LangSmith config (user fills in) |
| `state.py` | Shared TypedDict that all agents read/write |
| `agents/__init__.py` | Empty file that makes `agents/` a Python package |
| `agents/researcher.py` | Generates 4 questions about the topic and answers them |
| `agents/analyst.py` | Reads research and extracts a SWOT analysis |
| `agents/writer.py` | Reads research + SWOT and writes a markdown report |
| `graph.py` | Builds the LangGraph StateGraph connecting the 3 agents |
| `main.py` | Entry point: reads CLI arg, runs graph, saves `report.md` |
| `tests/test_state.py` | Tests for the state structure |
| `tests/test_researcher.py` | Tests for the Researcher agent |
| `tests/test_analyst.py` | Tests for the Analyst agent |
| `tests/test_writer.py` | Tests for the Writer agent |
| `tests/test_graph.py` | Tests for the graph structure |

---

## Task 0: Environment Setup

> **What you'll learn:** How to set up a Python project from scratch — virtual environments, package installation, and API keys.

**Files:**
- Create: `requirements.txt`
- Create: `.env`
- Create: `.gitignore`

> **Note:** A virtual environment (`venv`) is like a private workspace for your project — it keeps your packages isolated so they don't conflict with other Python projects on your machine. Think of it like a project-specific n8n installation.

- [ ] **Step 1: Check Python is installed**

```bash
python --version
```
Expected: `Python 3.11.x` or higher. If not installed, download from python.org.

- [ ] **Step 2: Create a virtual environment**

Run this inside your `fun/` folder:

```bash
python -m venv venv
```

This creates a `venv/` folder. You only do this once.

- [ ] **Step 3: Activate the virtual environment**

On Windows (bash terminal):
```bash
source venv/Scripts/activate
```

Your terminal prompt will now show `(venv)` at the start. You must do this every time you open a new terminal.

- [ ] **Step 4: Create `requirements.txt`**

```
langchain>=0.3.0
langgraph>=0.2.0
langsmith>=0.1.0
langchain-anthropic>=0.3.0
python-dotenv>=1.0.0
pytest>=8.0.0
langchain-core>=0.3.0
```

- [ ] **Step 5: Install the packages**

```bash
pip install -r requirements.txt
```

This may take a minute. Expected: lots of lines ending in `Successfully installed ...`

- [ ] **Step 6: Sign up for LangSmith (free)**

Go to smith.langchain.com → create a free account → go to Settings → API Keys → create a new key. Copy it.

- [ ] **Step 7: Create `.env` with your API keys**

```
ANTHROPIC_API_KEY=your_anthropic_key_here
LANGCHAIN_API_KEY=your_langsmith_key_here
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=research-workflow
```

> Your Anthropic API key is the same one Claude Code uses. Find it at console.anthropic.com → API Keys.

- [ ] **Step 8: Create `.gitignore` to protect your secrets**

```
.env
venv/
__pycache__/
*.pyc
report.md
.pytest_cache/
```

- [ ] **Step 9: Commit**

```bash
git add requirements.txt .gitignore
git commit -m "feat: add project dependencies and gitignore"
```

> Note: Never commit `.env` — it contains your API keys.

---

## Task 1: Shared State

> **What you'll learn:** Your first Python code — TypedDict, type hints, and how Python dictionaries work. Think of this as defining the "data schema" that passes between n8n nodes.

**Files:**
- Create: `state.py`
- Create: `tests/__init__.py`
- Create: `tests/test_state.py`

- [ ] **Step 1: Write the failing test first**

Create `tests/__init__.py` (empty file — makes `tests/` a Python package):
```python
```

Create `tests/test_state.py`:
```python
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
```

- [ ] **Step 2: Run the test — it should FAIL**

```bash
pytest tests/test_state.py -v
```

Expected: `ERROR: ModuleNotFoundError: No module named 'state'`

This is correct! The test fails because we haven't created `state.py` yet. That's TDD — write the test first, then write the code.

- [ ] **Step 3: Create `state.py`**

```python
# state.py
# TypedDict lets us define a dictionary with named, typed fields.
# It's like a schema for the data that flows through our graph.
from typing import TypedDict


class ResearchState(TypedDict):
    topic: str      # the company/industry the user typed in
    research: str   # filled in by the Researcher agent
    analysis: str   # filled in by the Analyst agent
    report: str     # filled in by the Writer agent
```

- [ ] **Step 4: Run the test — it should PASS**

```bash
pytest tests/test_state.py -v
```

Expected:
```
PASSED tests/test_state.py::test_state_has_all_required_fields
PASSED tests/test_state.py::test_state_can_be_updated_with_spread
```

- [ ] **Step 5: Commit**

```bash
git add state.py tests/__init__.py tests/test_state.py
git commit -m "feat: add ResearchState TypedDict with tests"
```

---

## Task 2: Researcher Agent

> **What you'll learn:** LangChain's three core concepts — prompt templates, LLM models, and output parsers — connected with the `|` pipe operator. Think of it like an n8n chain of nodes.

**Files:**
- Create: `agents/__init__.py`
- Create: `agents/researcher.py`
- Create: `tests/test_researcher.py`

- [ ] **Step 1: Write the failing test**

Create `agents/__init__.py` (empty):
```python
```

Create `tests/test_researcher.py`:
```python
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
```

- [ ] **Step 2: Run the test — it should FAIL**

```bash
pytest tests/test_researcher.py -v
```

Expected: `ERROR: ModuleNotFoundError: No module named 'agents.researcher'`

- [ ] **Step 3: Create `agents/researcher.py`**

```python
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
    llm = ChatAnthropic(model="claude-3-5-haiku-20241022")

    # Build the prompt template
    prompt = ChatPromptTemplate.from_template(RESEARCHER_PROMPT)

    # Connect prompt → llm → parser with the pipe operator
    # This is a LangChain "chain" — data flows left to right
    chain = prompt | llm | StrOutputParser()

    # Run the chain with our topic filled into the {topic} placeholder
    research = chain.invoke({"topic": state["topic"]})

    # Return only the fields we're updating — LangGraph merges this into the state
    return {"research": research}
```

- [ ] **Step 4: Run the test — it should PASS**

```bash
pytest tests/test_researcher.py -v
```

Expected:
```
PASSED tests/test_researcher.py::test_researcher_returns_research_key
PASSED tests/test_researcher.py::test_researcher_calls_llm
```

- [ ] **Step 5: Commit**

```bash
git add agents/__init__.py agents/researcher.py tests/test_researcher.py
git commit -m "feat: add Researcher agent with LangChain chain"
```

---

## Task 3: Analyst Agent

> **What you'll learn:** How to pass data from one agent to the next — the Analyst reads the Researcher's output from state and produces a SWOT analysis.

**Files:**
- Create: `agents/analyst.py`
- Create: `tests/test_analyst.py`

- [ ] **Step 1: Write the failing test**

Create `tests/test_analyst.py`:
```python
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
```

- [ ] **Step 2: Run the test — it should FAIL**

```bash
pytest tests/test_analyst.py -v
```

Expected: `ERROR: ModuleNotFoundError: No module named 'agents.analyst'`

- [ ] **Step 3: Create `agents/analyst.py`**

```python
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
    llm = ChatAnthropic(model="claude-3-5-haiku-20241022")
    prompt = ChatPromptTemplate.from_template(ANALYST_PROMPT)
    chain = prompt | llm | StrOutputParser()

    # Read from state.research (written by the Researcher agent)
    analysis = chain.invoke({"research": state["research"]})

    return {"analysis": analysis}
```

- [ ] **Step 4: Run the test — it should PASS**

```bash
pytest tests/test_analyst.py -v
```

Expected: 2 tests PASSED

- [ ] **Step 5: Commit**

```bash
git add agents/analyst.py tests/test_analyst.py
git commit -m "feat: add Analyst agent for SWOT extraction"
```

---

## Task 4: Writer Agent

> **What you'll learn:** How to write the final output — reading from multiple state fields, writing a formatted markdown report, and saving a file in Python.

**Files:**
- Create: `agents/writer.py`
- Create: `tests/test_writer.py`

- [ ] **Step 1: Write the failing test**

Create `tests/test_writer.py`:
```python
# tests/test_writer.py
# Same mocking pattern: mock_instance.return_value = "a string"
from unittest.mock import patch, MagicMock
from state import ResearchState
from agents.writer import writer


def test_writer_returns_report_key():
    fake_content = "# Business Report: Tesla\n\n## Executive Summary\nTesla is..."

    with patch("agents.writer.ChatAnthropic") as MockLLM:
        mock_instance = MagicMock()
        mock_instance.return_value = fake_content
        MockLLM.return_value = mock_instance

        state: ResearchState = {
            "topic": "Tesla",
            "research": "Q1: What is Tesla?\nA1: An EV company.",
            "analysis": "Strengths: Strong brand\nWeaknesses: High cost",
            "report": "",
        }

        result = writer(state)

        assert "report" in result
        assert result["report"] == fake_content


def test_writer_calls_llm():
    with patch("agents.writer.ChatAnthropic") as MockLLM:
        mock_instance = MagicMock()
        mock_instance.return_value = "# Report"
        MockLLM.return_value = mock_instance

        state: ResearchState = {
            "topic": "Apple",
            "research": "Detailed Apple research",
            "analysis": "Apple SWOT analysis",
            "report": "",
        }

        writer(state)

        assert mock_instance.called
```

- [ ] **Step 2: Run the test — it should FAIL**

```bash
pytest tests/test_writer.py -v
```

Expected: `ERROR: ModuleNotFoundError: No module named 'agents.writer'`

- [ ] **Step 3: Create `agents/writer.py`**

```python
# agents/writer.py
# The Writer is the final agent — it combines research + analysis into a polished report.
# Note: this prompt takes THREE inputs: {topic}, {research}, {analysis}

from langchain_anthropic import ChatAnthropic
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from state import ResearchState

WRITER_PROMPT = """You are a professional business writer.

Write a polished, concise business report in markdown format.

Topic: {topic}

Research Findings:
{research}

SWOT Analysis:
{analysis}

Write the report using this structure:

# Business Report: {topic}

## Executive Summary
[2-3 sentences summarizing the key takeaways]

## Key Research Findings
[4 bullet points, one per research question — keep each to 1-2 sentences]

## SWOT Analysis
[Format the SWOT cleanly with headers and bullets]

## Conclusion
[2-3 sentences with a forward-looking perspective]

---
*Report generated by AI research workflow*

Use professional, clear language. Do not add any extra sections."""


def writer(state: ResearchState) -> dict:
    llm = ChatAnthropic(model="claude-3-5-haiku-20241022")
    prompt = ChatPromptTemplate.from_template(WRITER_PROMPT)
    chain = prompt | llm | StrOutputParser()

    # This agent reads from THREE state fields
    report = chain.invoke(
        {
            "topic": state["topic"],
            "research": state["research"],
            "analysis": state["analysis"],
        }
    )

    return {"report": report}
```

- [ ] **Step 4: Run the test — it should PASS**

```bash
pytest tests/test_writer.py -v
```

Expected: 2 tests PASSED

- [ ] **Step 5: Commit**

```bash
git add agents/writer.py tests/test_writer.py
git commit -m "feat: add Writer agent for report generation"
```

---

## Task 5: Graph Assembly

> **What you'll learn:** LangGraph — how to wire agents together as a directed graph. This is like building an n8n workflow in code: define nodes, connect them with edges, set the start point.

**Files:**
- Create: `graph.py`
- Create: `tests/test_graph.py`

- [ ] **Step 1: Write the failing test**

Create `tests/test_graph.py`:
```python
# tests/test_graph.py
# We test that the graph compiles correctly and has the right structure.
# We don't run the graph here (that would call the real API).
from graph import build_graph


def test_graph_compiles_without_error():
    # If this doesn't raise an exception, the graph is valid
    graph = build_graph()
    assert graph is not None


def test_graph_has_correct_nodes():
    graph = build_graph()
    # LangGraph compiled graphs expose their node names
    node_names = set(graph.nodes)
    assert "researcher" in node_names
    assert "analyst" in node_names
    assert "writer" in node_names
```

- [ ] **Step 2: Run the test — it should FAIL**

```bash
pytest tests/test_graph.py -v
```

Expected: `ERROR: ModuleNotFoundError: No module named 'graph'`

- [ ] **Step 3: Create `graph.py`**

```python
# graph.py
# LangGraph works like this:
# 1. Create a StateGraph with your state type
# 2. Add nodes (each node is a function that takes state and returns updated state)
# 3. Add edges (arrows between nodes)
# 4. Set the entry point (where the graph starts)
# 5. Compile (validates and builds the runnable graph)

from langgraph.graph import END, StateGraph

from agents.analyst import analyst
from agents.researcher import researcher
from agents.writer import writer
from state import ResearchState


def build_graph():
    # Create a graph that uses ResearchState as its data container
    graph = StateGraph(ResearchState)

    # Add each agent as a node
    # The string name ("researcher") is how we reference it in edges
    graph.add_node("researcher", researcher)
    graph.add_node("analyst", analyst)
    graph.add_node("writer", writer)

    # Set where the graph starts
    graph.set_entry_point("researcher")

    # Add edges: researcher → analyst → writer → END
    # END is a special LangGraph constant meaning "stop here"
    graph.add_edge("researcher", "analyst")
    graph.add_edge("analyst", "writer")
    graph.add_edge("writer", END)

    # Compile validates the graph and returns a runnable object
    return graph.compile()
```

- [ ] **Step 4: Run the test — it should PASS**

```bash
pytest tests/test_graph.py -v
```

Expected: 2 tests PASSED

- [ ] **Step 5: Run ALL tests to make sure nothing is broken**

```bash
pytest tests/ -v
```

Expected: All 10 tests PASSED

- [ ] **Step 6: Commit**

```bash
git add graph.py tests/test_graph.py
git commit -m "feat: build LangGraph StateGraph connecting all three agents"
```

---

## Task 6: Main Entry Point

> **What you'll learn:** How to run a Python script from the command line, read arguments, and write files. This is the final wiring that makes everything work together.

**Files:**
- Create: `main.py`

> No unit test for `main.py` — we'll validate it by running it end-to-end in Task 7.

- [ ] **Step 1: Create `main.py`**

```python
# main.py
# This is the entry point — the file you run from the terminal.
#
# sys.argv is a list of command-line arguments:
#   python main.py "Tesla"
#   sys.argv[0] = "main.py"
#   sys.argv[1] = "Tesla"
#
# IMPORTANT: load_dotenv() must be called BEFORE importing from graph.py,
# because graph.py imports the agent files, which import ChatAnthropic.
# LangSmith reads env vars when the library is first loaded.

import sys
from dotenv import load_dotenv

# Load .env before any LangChain/LangSmith code is imported
load_dotenv()

from graph import build_graph  # must come after load_dotenv() above


def main():
    # Check that the user provided a topic
    if len(sys.argv) < 2:
        print("Usage: python main.py <topic>")
        print('Example: python main.py "Tesla"')
        sys.exit(1)

    topic = sys.argv[1]

    print(f"\nStarting research on: {topic}")
    print("Running: Researcher → Analyst → Writer")
    print("This takes 30-60 seconds...\n")

    # Build and run the graph
    graph = build_graph()

    # invoke() starts the graph with an initial state
    # All fields must be present — empty strings for the ones not yet filled
    result = graph.invoke(
        {
            "topic": topic,
            "research": "",
            "analysis": "",
            "report": "",
        }
    )

    # Print the report to the terminal
    print(result["report"])

    # Save the report to a file
    # "w" means write mode, encoding="utf-8" handles special characters
    with open("report.md", "w", encoding="utf-8") as f:
        f.write(result["report"])

    print(f"\nReport saved to report.md")


# This guard means: only run main() if this file is run directly
# (not when it's imported by another file)
if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run all tests one final time**

```bash
pytest tests/ -v
```

Expected: All tests PASSED

- [ ] **Step 3: Commit**

```bash
git add main.py
git commit -m "feat: add main entry point to run the full research workflow"
```

---

## Task 7: End-to-End Run + LangSmith Verification

> **What you'll learn:** Running the complete workflow, reading the output, and observing every LLM call in the LangSmith dashboard.

- [ ] **Step 1: Verify your `.env` is complete**

Open `.env` and confirm all four values are filled in:
```
ANTHROPIC_API_KEY=sk-ant-...
LANGCHAIN_API_KEY=ls__...
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=research-workflow
```

- [ ] **Step 2: Run the workflow**

```bash
python main.py "Tesla"
```

Expected output:
```
Starting research on: Tesla
Running: Researcher → Analyst → Writer
This takes 30-60 seconds...

# Business Report: Tesla

## Executive Summary
...

## Key Research Findings
...

## SWOT Analysis
...

## Conclusion
...

Report saved to report.md
```

- [ ] **Step 3: Read the generated report**

```bash
cat report.md
```

You should see the full markdown report.

- [ ] **Step 4: Open LangSmith dashboard**

Go to smith.langchain.com → Projects → `research-workflow`.

You should see one trace. Click it and explore:
- Each of the 3 agent calls is a separate span
- You can see the exact prompt sent to Claude
- You can see Claude's exact response
- You can see token counts and latency per step

- [ ] **Step 5: Try a second topic**

```bash
python main.py "electric vehicles"
```

Check LangSmith again — you should now see 2 traces.

- [ ] **Step 6: Final commit**

```bash
git add .
git commit -m "feat: complete multi-agent research workflow — all agents, graph, and main entry"
```

---

## What You Built and What You Learned

| File | Python concept | LangChain/Graph concept |
|------|---------------|------------------------|
| `state.py` | TypedDict, type hints | Shared state between nodes |
| `agents/researcher.py` | Functions, f-strings | Prompt templates, LLM call, output parser, pipe operator |
| `agents/analyst.py` | Passing dicts, string formatting | Chaining from previous agent's output |
| `agents/writer.py` | Multiple inputs, file I/O | Multi-input prompts |
| `graph.py` | Imports, return values | StateGraph, nodes, edges, compile |
| `main.py` | sys.argv, with/open | End-to-end orchestration |
| LangSmith | — | Tracing, observability, debugging |

**Next steps after this project:**
- Add web search (Tavily tool) to give agents real-time data
- Add a conditional branch: different report templates for companies vs industries
- Add streaming output so you see words appear as Claude writes them
