from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
from core.config import settings
from routers import auth, documents, generate, diagrams, export


def _ensure_faiss_bucket():
    """Creates the faiss-indexes Storage bucket if it doesn't already exist."""
    try:
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        buckets = supabase.storage.list_buckets()
        existing = [b.name for b in buckets]
        if "faiss-indexes" not in existing:
            supabase.storage.create_bucket(
                "faiss-indexes",
                options={"public": False}
            )
    except Exception as exc:
        # Non-fatal: log and continue. Bucket may already exist or be managed externally.
        print(f"[startup] Could not ensure faiss-indexes bucket: {exc}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    _ensure_faiss_bucket()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(documents.router, prefix=settings.API_V1_STR)
app.include_router(generate.router, prefix=settings.API_V1_STR)
app.include_router(diagrams.router, prefix=settings.API_V1_STR)
app.include_router(export.router, prefix=settings.API_V1_STR)

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
