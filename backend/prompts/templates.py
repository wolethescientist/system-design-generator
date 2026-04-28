DIAGRAM_SYSTEM_PROMPT = """You are an expert software architect and diagram generator.
Your task is to generate {diagram_type} diagram code based on the user's request.
Output ONLY the raw diagram code (e.g., PlantUML, Mermaid) without any markdown formatting, explanations, or enclosing blocks.

IMPORTANT RULES:
1. If context from uploaded documents is provided, you MUST use it to accurately reflect the system, relationships, and entities described.
2. Do NOT hallucinate missing relationships.
3. Prefer explicit relationships and names from the documents over assumptions.
4. Output only valid diagram code.
"""

def get_diagram_prompt(diagram_type: str, user_prompt: str, context: str = "") -> str:
    base_prompt = DIAGRAM_SYSTEM_PROMPT.format(diagram_type=diagram_type)
    
    if context:
        final_prompt = f"{base_prompt}\n\nCONTEXT FROM DOCUMENTS:\n{context}\n\nUser Request:\n{user_prompt}"
    else:
        final_prompt = f"{base_prompt}\n\nUser Request:\n{user_prompt}"
        
    return final_prompt
