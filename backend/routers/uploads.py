"""
File upload endpoints.
Files are saved to backend/uploads/ and served via StaticFiles at /uploads.
"""
import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from auth.dependencies import require_teacher

UPLOAD_BASE = os.path.join(os.path.dirname(__file__), "..", "uploads")
AUDIO_DIR   = os.path.join(UPLOAD_BASE, "audio")
IMAGE_DIR   = os.path.join(UPLOAD_BASE, "images")

ALLOWED_AUDIO = {"audio/mpeg", "audio/wav", "audio/mp3", "audio/x-wav", "audio/wave"}
ALLOWED_IMAGE = {"image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"}
MAX_AUDIO_MB  = 20
MAX_IMAGE_MB  = 5

router = APIRouter(prefix="/api/uploads", tags=["Uploads"])


@router.post("/audio")
async def upload_audio(
    file: UploadFile = File(...),
    _current_user=Depends(require_teacher)
):
    """Upload an audio file (mp3 / wav). Returns the URL path."""
    if file.content_type not in ALLOWED_AUDIO:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Allowed: mp3, wav"
        )
    content = await file.read()
    if len(content) / (1024 * 1024) > MAX_AUDIO_MB:
        raise HTTPException(status_code=400, detail=f"File too large (max {MAX_AUDIO_MB} MB)")

    os.makedirs(AUDIO_DIR, exist_ok=True)
    ext      = os.path.splitext(file.filename or "audio.mp3")[1] or ".mp3"
    filename = f"{uuid.uuid4()}{ext}"
    with open(os.path.join(AUDIO_DIR, filename), "wb") as f:
        f.write(content)

    return {"url": f"/uploads/audio/{filename}", "filename": filename}


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    _current_user=Depends(require_teacher)
):
    """Upload an image for an MCQ option (jpg / png / gif / webp). Returns the URL path."""
    if file.content_type not in ALLOWED_IMAGE:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Allowed: jpg, png, gif, webp"
        )
    content = await file.read()
    if len(content) / (1024 * 1024) > MAX_IMAGE_MB:
        raise HTTPException(status_code=400, detail=f"File too large (max {MAX_IMAGE_MB} MB)")

    os.makedirs(IMAGE_DIR, exist_ok=True)
    ext      = os.path.splitext(file.filename or "image.jpg")[1] or ".jpg"
    filename = f"{uuid.uuid4()}{ext}"
    with open(os.path.join(IMAGE_DIR, filename), "wb") as f:
        f.write(content)

    return {"url": f"/uploads/images/{filename}", "filename": filename}
