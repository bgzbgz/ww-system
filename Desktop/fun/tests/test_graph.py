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
