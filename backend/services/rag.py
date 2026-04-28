import os
import io
import zipfile
import tempfile
import uuid
from typing import List, Dict, Any
from fastapi import UploadFile
from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from supabase import create_client

from core.config import settings

# Global in-memory cache for vector stores (cleared on process restart)
_vector_stores: Dict[str, FAISS] = {}

# Supabase Storage bucket name
FAISS_BUCKET = "faiss-indexes"


def _get_supabase_admin():
    """Service-role client — bypasses RLS, used for Storage operations."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


def get_embeddings():
    return GoogleGenerativeAIEmbeddings(
        model="models/embedding-001",
        google_api_key=settings.GEMINI_API_KEY
    )


def _object_key(user_id: str) -> str:
    """Returns the Supabase Storage object key for a user's FAISS index."""
    return f"{user_id}/faiss_index.zip"


def _upload_index_to_supabase(user_id: str, index_dir: str):
    """
    Zips the FAISS index files (index.faiss + index.pkl) from index_dir
    and uploads to Supabase Storage.
    """
    supabase = _get_supabase_admin()
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for fname in ["index.faiss", "index.pkl"]:
            fpath = os.path.join(index_dir, fname)
            if os.path.exists(fpath):
                zf.write(fpath, fname)

    zip_bytes = zip_buffer.getvalue()
    object_key = _object_key(user_id)

    # Try update first, fall back to insert (upsert not always available in older SDK)
    try:
        supabase.storage.from_(FAISS_BUCKET).upload(
            object_key,
            zip_bytes,
            file_options={"content-type": "application/zip", "upsert": "true"},
        )
    except Exception:
        # If upload with upsert fails, remove old and re-upload
        try:
            supabase.storage.from_(FAISS_BUCKET).remove([object_key])
        except Exception:
            pass
        supabase.storage.from_(FAISS_BUCKET).upload(
            object_key,
            zip_bytes,
            file_options={"content-type": "application/zip"},
        )


def _download_index_from_supabase(user_id: str, dest_dir: str) -> bool:
    """
    Downloads the FAISS index zip from Supabase Storage and extracts it to dest_dir.
    Returns True if successful, False if not found.
    """
    supabase = _get_supabase_admin()
    object_key = _object_key(user_id)

    try:
        response = supabase.storage.from_(FAISS_BUCKET).download(object_key)
    except Exception:
        return False

    if not response:
        return False

    zip_buffer = io.BytesIO(response)
    with zipfile.ZipFile(zip_buffer, "r") as zf:
        zf.extractall(dest_dir)

    return True


def get_vector_store(user_id: str) -> FAISS:
    """
    Returns the FAISS vector store for the user.
    Priority: in-memory cache → Supabase Storage → create fresh.
    """
    if user_id in _vector_stores:
        return _vector_stores[user_id]

    embeddings = get_embeddings()

    with tempfile.TemporaryDirectory() as tmp_dir:
        downloaded = _download_index_from_supabase(user_id, tmp_dir)

        if downloaded and os.path.exists(os.path.join(tmp_dir, "index.faiss")):
            vector_store = FAISS.load_local(
                tmp_dir, embeddings, allow_dangerous_deserialization=True
            )
        else:
            # Bootstrap with an empty placeholder document
            empty_doc = Document(
                page_content="empty",
                metadata={"user_id": user_id, "is_empty": True}
            )
            vector_store = FAISS.from_documents([empty_doc], embeddings)

    _vector_stores[user_id] = vector_store
    return vector_store


def save_vector_store(user_id: str, vector_store: FAISS):
    """
    Saves the FAISS index to a temp directory, uploads to Supabase Storage,
    and updates the in-memory cache.
    """
    with tempfile.TemporaryDirectory() as tmp_dir:
        vector_store.save_local(tmp_dir)
        _upload_index_to_supabase(user_id, tmp_dir)

    _vector_stores[user_id] = vector_store


async def process_and_store_document(
    file_path: str, filename: str, user_id: str, doc_id: str
) -> str:
    ext = os.path.splitext(filename)[1].lower()

    if ext == ".pdf":
        loader = PyPDFLoader(file_path)
    elif ext == ".docx":
        loader = Docx2txtLoader(file_path)
    elif ext in [".txt", ".md"]:
        loader = TextLoader(file_path, encoding="utf-8")
    else:
        raise ValueError(f"Unsupported file extension: {ext}")

    docs = loader.load()
    full_text = "\n".join([doc.page_content for doc in docs])

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=150
    )
    chunks = text_splitter.split_documents(docs)

    for chunk in chunks:
        chunk.metadata.update({
            "user_id": user_id,
            "doc_id": doc_id,
            "filename": filename,
        })

    vector_store = get_vector_store(user_id)
    vector_store.add_documents(chunks)
    save_vector_store(user_id, vector_store)

    return full_text


def retrieve_context(query: str, user_id: str, top_k: int = 3) -> str:
    vector_store = get_vector_store(user_id)

    results = vector_store.similarity_search(
        query,
        k=top_k,
        filter={"user_id": user_id}
    )

    valid_results = [r for r in results if not r.metadata.get("is_empty")]

    if not valid_results:
        return ""

    context_chunks = [doc.page_content for doc in valid_results]
    return "\n\n---\n\n".join(context_chunks)


def delete_document_from_index(user_id: str, doc_id: str):
    vector_store = get_vector_store(user_id)

    docstore = vector_store.docstore._dict
    ids_to_delete = [
        doc_uuid
        for doc_uuid, doc in docstore.items()
        if doc.metadata.get("doc_id") == doc_id
    ]

    if ids_to_delete:
        vector_store.delete(ids_to_delete)
        save_vector_store(user_id, vector_store)
