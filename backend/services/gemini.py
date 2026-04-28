from langchain_google_genai import ChatGoogleGenerativeAI
from core.config import settings

def get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-3-flash-preview",
        google_api_key=settings.GEMINI_API_KEY,
        temperature=0.2
    )

async def generate_diagram(prompt: str) -> str:
    llm = get_llm()
    response = await llm.ainvoke(prompt)
    content = response.content
    if isinstance(content, list):
        # Extract text if the content is returned as a list of dictionaries or strings
        content = "".join([str(item.get("text", "")) if isinstance(item, dict) else str(item) for item in content])
    return content
