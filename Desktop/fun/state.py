# state.py
# TypedDict lets us define a dictionary with named, typed fields.
# It's like a schema for the data that flows through our graph.
from typing import TypedDict


class ResearchState(TypedDict):
    topic: str      # the company/industry the user typed in
    research: str   # filled in by the Researcher agent
    analysis: str   # filled in by the Analyst agent
    report: str     # filled in by the Writer agent
