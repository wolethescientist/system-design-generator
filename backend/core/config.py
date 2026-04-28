from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Diagram Generator API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    SUPABASE_URL: str
    SUPABASE_KEY: str          # anon/public key
    SUPABASE_SERVICE_KEY: str  # service_role key (for Storage operations)
    
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    GEMINI_API_KEY: str

    class Config:
        env_file = ".env"

settings = Settings()
