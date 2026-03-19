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

    try:
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
    except Exception as e:
        print(f"\nError running the workflow: {e}")
        print("Check that your ANTHROPIC_API_KEY is set correctly in .env")
        sys.exit(1)

    # Print the report to the terminal
    print(result["report"])

    # Save the report to a file
    # "w" means write mode, encoding="utf-8" handles special characters
    with open("report.md", "w", encoding="utf-8") as f:
        f.write(result["report"])

    print("\nReport saved to report.md")


# This guard means: only run main() if this file is run directly
# (not when it's imported by another file)
if __name__ == "__main__":
    main()
