def validate_diagram_type(diagram_type: str) -> bool:
    valid_types = ["plantuml", "mermaid", "graphviz", "flowchart", "sequence", "class", "state", "er", "user-journey", "gantt", "pie"]
    return diagram_type.lower() in valid_types
