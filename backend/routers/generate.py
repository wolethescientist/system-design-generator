from fastapi import APIRouter, Depends, HTTPException
from models.schemas import User, GenerateRequest, GenerateResponse
from services.auth import get_current_user
from services.rag import retrieve_context
from prompts.templates import get_diagram_prompt
from services.gemini import generate_diagram
from services.validator import validate_diagram_type

router = APIRouter(prefix="/generate", tags=["Generation"])

@router.post("", response_model=GenerateResponse)
async def generate(
    request: GenerateRequest,
    current_user: User = Depends(get_current_user)
):
    if not validate_diagram_type(request.diagram_type):
        raise HTTPException(status_code=400, detail=f"Unsupported diagram type: {request.diagram_type}")
        
    context = ""
    if request.use_context:
        context = retrieve_context(request.prompt, current_user.id, top_k=3)
        
    final_prompt = get_diagram_prompt(request.diagram_type, request.prompt, context)
    
    try:
        diagram_code = await generate_diagram(final_prompt)
        return GenerateResponse(
            diagram_code=diagram_code.strip(),
            diagram_type=request.diagram_type
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")
