import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from models.schemas import UserCreate, Token, User, UserLogin
from core.security import get_password_hash, verify_password
from services.auth import create_access_token, get_supabase, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=User)
async def register(user: UserCreate):
    supabase = get_supabase()
    
    # Check if user exists
    existing_user = supabase.table("users").select("*").eq("email", user.email).execute()
    if existing_user.data:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Create user
    hashed_password = get_password_hash(user.password)
    user_id = str(uuid.uuid4())
    
    new_user = {
        "id": user_id,
        "email": user.email,
        "hashed_password": hashed_password
    }
    
    result = supabase.table("users").insert(new_user).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create user")
        
    return User(**result.data[0])

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    supabase = get_supabase()
    
    user_response = supabase.table("users").select("*").eq("email", form_data.username).execute()
    if not user_response.data:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    user_data = user_response.data[0]
    
    if not verify_password(form_data.password, user_data["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    access_token = create_access_token(
        data={"sub": user_data["id"], "email": user_data["email"]}
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
