# Business Research Workflow

An AI-powered tool that takes a company or industry name and produces a structured business report.

You type this:
```
python main.py "Tesla"
```

You get this: a full markdown business report with research findings, SWOT analysis, and conclusion — saved as `report.md`.

---

## How it works — the three tools explained

This project uses three tools from the LangChain ecosystem. They do very different things.

### LangChain — talking to AI

LangChain is a Python library that makes it easy to call AI models (like Claude or GPT) from your code. Instead of writing raw API calls, you build a **chain**: a prompt template + an AI model + an output parser, connected with the `|` pipe operator.

```python
chain = prompt | llm | StrOutputParser()
result = chain.invoke({"topic": "Tesla"})
```

Think of it like an n8n node — you define what goes in, what happens, and what comes out. LangChain handles the API call in between.

**Used in:** `agents/researcher.py`, `agents/analyst.py`, `agents/writer.py`

---

### LangGraph — connecting multiple AI steps

LangGraph is built on top of LangChain. While LangChain handles a single AI call, LangGraph lets you connect **multiple AI calls into a workflow** — with shared data, branching logic, and loops.

You define a graph: nodes (functions that do work) and edges (arrows between them).

```
Researcher node --> Analyst node --> Writer node --> END
```

All three nodes share the same state object, so each agent can read what the previous one wrote.

**Think of it like:** an n8n workflow, but written in Python code instead of a visual editor.

**Used in:** `graph.py`

---

### LangSmith — observing what happened

LangSmith is a dashboard that records every AI call your workflow makes. After you run the tool, you can open LangSmith and see:

- The exact prompt that was sent to Claude
- The exact response Claude gave back
- How long each step took
- How many tokens were used (and what it cost)

You don't write any LangSmith code — it works automatically when you set the environment variables. It's purely for visibility and debugging.

**Used in:** automatically, via `.env` settings

---

## Setup

### What you need

- Python 3.11+ — download from [python.org](https://python.org) if you don't have it
- An Anthropic API key — get one at [console.anthropic.com](https://console.anthropic.com) → API Keys
- A LangSmith account (free) — sign up at [smith.langchain.com](https://smith.langchain.com) → Settings → API Keys

---

### Step 1 — Get the project

Download or clone this folder onto your computer. Open a terminal (PowerShell on Windows, Terminal on Mac) inside the folder.

---

### Step 2 — Create a virtual environment

A virtual environment is an isolated space for this project's packages — it keeps things clean and separate from other Python projects on your machine.

**Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**Mac / Linux:**
```bash
python -m venv venv
source venv/bin/activate
```

You'll know it worked when you see `(venv)` at the start of your terminal prompt.

> You need to activate the venv every time you open a new terminal window before running the tool.

---

### Step 3 — Install the packages

```bash
pip install -r requirements.txt
```

This installs LangChain, LangGraph, LangSmith, and everything else the project needs. It takes about a minute.

---

### Step 4 — Add your API keys

Create a file called `.env` in the project folder (no filename, just the extension). Add these four lines and fill in your two keys:

```
ANTHROPIC_API_KEY=your_anthropic_key_here
LANGCHAIN_API_KEY=your_langsmith_key_here
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=research-workflow
```

- `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com) → API Keys (starts with `sk-ant-`)
- `LANGCHAIN_API_KEY` — from [smith.langchain.com](https://smith.langchain.com) → Settings → API Keys (starts with `ls__`)
- Leave the last two lines exactly as shown — they enable LangSmith tracing

> **Never share your `.env` file.** It contains your private API keys.

---

## Running the tool

With your venv activated, run:

```bash
python main.py "Tesla"
```

Replace `"Tesla"` with any company or industry you want to research. The workflow takes 30–60 seconds to complete.

**What happens:**
1. The **Researcher** generates 4 research questions about your topic and answers them
2. The **Analyst** reads the research and extracts a SWOT analysis
3. The **Writer** combines everything into a polished markdown report

The report prints in your terminal and is saved as `report.md` in the project folder.

---

## Viewing traces in LangSmith

After running the tool, go to [smith.langchain.com](https://smith.langchain.com) → **Projects** → **research-workflow**.

You'll see a trace for each run. Click on one to explore:
- Every prompt sent to Claude, word for word
- Every response Claude returned
- Time taken and tokens used per step

This is useful for debugging, improving your prompts, or just understanding what the AI is actually doing.

---

## Project structure

```
├── main.py              # entry point — run this
├── state.py             # the shared data object passed between agents
├── graph.py             # builds the LangGraph workflow
├── agents/
│   ├── researcher.py    # LangChain agent: generates and answers research questions
│   ├── analyst.py       # LangChain agent: extracts SWOT analysis
│   └── writer.py        # LangChain agent: writes the final report
├── requirements.txt     # Python packages
└── .env                 # your API keys (create this yourself, never share it)
```

---

## Troubleshooting

**`.\venv\Scripts\Activate.ps1` gives a permissions error**
Run this first, then try again:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**`Error running the workflow: Error code: 401`**
Your Anthropic API key is wrong or missing. Check your `.env` file.

**`Error running the workflow: Error code: 404`**
The model name is outdated. Open each file in `agents/` and make sure the model is set to `claude-haiku-4-5-20251001`.

**No traces appearing in LangSmith**
Make sure your `.env` has `LANGCHAIN_TRACING_V2=true` and a valid `LANGCHAIN_API_KEY`.
