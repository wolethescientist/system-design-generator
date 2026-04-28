from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None

class User(BaseModel):
    id: str
    email: str
    created_at: datetime

class DocumentResponse(BaseModel):
    id: str
    user_id: str
    filename: str
    created_at: datetime

class GenerateRequest(BaseModel):
    prompt: str
    diagram_type: str
    use_context: bool = False

class GenerateResponse(BaseModel):
    diagram_code: str
    diagram_type: str

class ExportRequest(BaseModel):
    diagram_code: str
    format: str = "png"
