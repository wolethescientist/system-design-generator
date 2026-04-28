from fastapi import APIRouter, Depends
from models.schemas import User
from services.auth import get_current_user

router = APIRouter(prefix="/diagrams", tags=["Diagrams"])

@router.get("")
async def list_diagrams(current_user: User = Depends(get_current_user)):
    return {"message": "Diagram history endpoint placeholder"}
