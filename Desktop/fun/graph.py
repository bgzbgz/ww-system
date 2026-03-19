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
