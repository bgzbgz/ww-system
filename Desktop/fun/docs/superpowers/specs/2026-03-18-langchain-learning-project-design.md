# Multi-Agent Business Research Workflow — Design Spec

**Date:** 2026-03-18
**Project:** LangChain / LangGraph / LangSmith Learning Project
**Status:** Approved

---

## Overview

A multi-step AI workflow that takes a company or industry name as input and produces a structured business research report. Three specialized agents — Researcher, Analyst, and Writer — each handle one job, passing results through a shared state object orchestrated by LangGraph. LangSmith traces every LLM call for observability.

**User profile:** New to Python and LLM APIs. Experienced with n8n (workflow automation), Speckit, and Claude Code.

**Goal:** Learn Python basics, LangChain, LangGraph, and LangSmith by building something genuinely useful.

---

## Architecture

```
User input (topic: string)
        ↓
  [ Researcher Agent ]   → generates 4 questions, answers each with Claude
        ↓
  [ Analyst Agent ]      → reads research, extracts SWOT analysis
        ↓
  [ Writer Agent ]       → writes a formatted markdown business report
        ↓
  Output: report.md + terminal print
```

LangGraph controls the flow. LangSmith observes it. LangChain powers each agent.

---

## Components

### Shared State (`state.py`)
A Python TypedDict with four fields:
- `topic` — the input company/industry name
- `research` — questions + answers from Researcher
- `analysis` — SWOT output from Analyst
- `report` — final markdown report from Writer

*Learning: Python TypedDict, type hints, data structures*

### Researcher Agent (`agents/researcher.py`)
- Input: `state.topic`
- Process: generates 4 research questions → answers each one using Claude
- Output: writes to `state.research`
- *Learning: LangChain prompt templates, `ChatAnthropic` model, string output parser*

### Analyst Agent (`agents/analyst.py`)
- Input: `state.research`
- Process: extracts Strengths, Weaknesses, Opportunities, Threats
- Output: writes to `state.analysis`
- *Learning: chaining LLM calls, passing context between steps, structured prompting*

### Writer Agent (`agents/writer.py`)
- Input: `state.analysis`
- Process: writes a professional 1-page markdown business report
- Output: writes to `state.report`
- *Learning: formatting prompts, file I/O in Python (`open`, `write`)*

### Graph (`graph.py`)
- Builds a `StateGraph` with three nodes (one per agent)
- Connects them with edges: `researcher → analyst → writer`
- Sets entry point and compiles the graph
- *Learning: LangGraph `StateGraph`, `add_node`, `add_edge`, `set_entry_point`, `compile`*

### Entry Point (`main.py`)
- Reads topic from command line args
- Invokes the compiled graph
- Prints the report and saves to `report.md`
- *Learning: `sys.argv`, running a Python script*

---

## Data Flow

```
main.py
  └─ invokes graph with { topic: "Tesla" }
       └─ Researcher: generates research → { topic, research }
            └─ Analyst: extracts SWOT → { topic, research, analysis }
                 └─ Writer: writes report → { topic, research, analysis, report }
                      └─ main.py saves report.md
```

---

## File Structure

```
fun/
├── .env                    ← ANTHROPIC_API_KEY, LANGSMITH_API_KEY
├── requirements.txt        ← langchain, langgraph, langsmith, langchain-anthropic, python-dotenv
├── main.py
├── state.py
├── graph.py
├── agents/
│   ├── researcher.py
│   ├── analyst.py
│   └── writer.py
└── docs/
    └── superpowers/specs/
        └── 2026-03-18-langchain-learning-project-design.md
```

---

## Build Order

Each step introduces one new concept:

1. **`state.py`** — Python TypedDict (first Python code)
2. **`agents/researcher.py`** — LangChain: prompts, Claude, output parsers
3. **`agents/analyst.py`** — chaining LLM calls, structured output
4. **`agents/writer.py`** — formatting prompts, file I/O
5. **`graph.py`** — LangGraph: StateGraph, nodes, edges
6. **`main.py`** — wire it all together and run it
7. **LangSmith dashboard** — observe traces of the full run

---

## Setup Requirements

- Python 3.11+
- `pip install` the packages in `requirements.txt`
- Anthropic API key (already available via Claude Code)
- LangSmith account (free tier) + API key

---

## Success Criteria

- `python main.py "Tesla"` runs end-to-end without errors
- A `report.md` file is generated with a structured business report
- LangSmith dashboard shows the full trace with all three agent calls
- User understands what each file does and why

---

## Out of Scope

- Web search / real-time data (uses Claude's training knowledge only)
- UI or frontend
- Authentication or user management
- Saving multiple reports / history
