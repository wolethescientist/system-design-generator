import os
import uuid
import tempfile
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from typing import List
from models.schemas import User, DocumentResponse
from services.auth import get_current_user, get_supabase
from services.rag import process_and_store_document, delete_document_from_index

router = APIRouter(prefix="/documents", tags=["Documents"])

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"]

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    # Validate extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")
        
    # Validate size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")
        
    doc_id = str(uuid.uuid4())
    
    # Save temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp_file:
        temp_file.write(content)
        temp_path = temp_file.name
        
    try:
        # Process and extract text
        extracted_text = await process_and_store_document(
            temp_path, 
            file.filename, 
            current_user.id, 
            doc_id
        )
        
        # Save to DB
        supabase = get_supabase()
        doc_data = {
            "id": doc_id,
            "user_id": current_user.id,
            "filename": file.filename,
            "content": extracted_text
        }
        
        result = supabase.table("documents").insert(doc_data).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to save document metadata")
            
        return DocumentResponse(**result.data[0])
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@router.get("", response_model=List[DocumentResponse])
async def list_documents(current_user: User = Depends(get_current_user)):
    supabase = get_supabase()
    result = supabase.table("documents").select("id, user_id, filename, created_at").eq("user_id", current_user.id).execute()
    return [DocumentResponse(**doc) for doc in result.data]

@router.delete("/{doc_id}")
async def delete_document(doc_id: str, current_user: User = Depends(get_current_user)):
    supabase = get_supabase()
    
    # Verify ownership
    doc_response = supabase.table("documents").select("id").eq("id", doc_id).eq("user_id", current_user.id).execute()
    if not doc_response.data:
        raise HTTPException(status_code=404, detail="Document not found or unauthorized")
        
    # Delete from DB
    supabase.table("documents").delete().eq("id", doc_id).execute()
    
    # Delete from vector store
    try:
        delete_document_from_index(current_user.id, doc_id)
    except Exception as e:
        print(f"Failed to delete from vector index: {e}")
        # Not failing the request if DB delete succeeded, but logged
        
    return {"message": "Document deleted successfully"}
