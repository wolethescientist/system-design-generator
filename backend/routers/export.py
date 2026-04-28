from fastapi import APIRouter, Depends
from models.schemas import User, ExportRequest
from services.auth import get_current_user

router = APIRouter(prefix="/export", tags=["Export"])

@router.post("")
async def export_diagram(
    request: ExportRequest,
    current_user: User = Depends(get_current_user)
):
    return {"message": "Export diagram endpoint placeholder", "format": request.format}
