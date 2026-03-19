# Business Research Workflow

An AI-powered tool that takes a company or industry name and produces a structured business report. Three agents run in sequence: Researcher → Analyst → Writer.

## What you need

- Python 3.11+
- An [Anthropic API key](https://console.anthropic.com) (for Claude)
- A [LangSmith account](https://smith.langchain.com) (free, for observability)

## Setup

**1. Clone or download this folder, then open a terminal inside it.**

**2. Create and activate a virtual environment:**

```bash
# Windows (PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Mac / Linux
python -m venv venv
source venv/bin/activate
```

**3. Install dependencies:**

```bash
pip install -r requirements.txt
```

**4. Create a `.env` file** in the project folder with your API keys:

```
ANTHROPIC_API_KEY=your_anthropic_key_here
LANGCHAIN_API_KEY=your_langsmith_key_here
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=research-workflow
```

## Run it

```bash
python main.py "Tesla"
```

The report prints to the terminal and is saved as `report.md`.

To observe the full AI trace (prompts, responses, token usage), go to [smith.langchain.com](https://smith.langchain.com) → Projects → `research-workflow`.

## Project structure

```
├── main.py              # entry point — run this
├── state.py             # shared data between agents
├── graph.py             # connects the agents into a workflow
├── agents/
│   ├── researcher.py    # generates research questions and answers them
│   ├── analyst.py       # extracts a SWOT analysis
│   └── writer.py        # writes the final markdown report
└── requirements.txt
```
