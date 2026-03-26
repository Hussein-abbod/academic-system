"""
File upload endpoints.
Files are saved to backend/uploads/ and served via StaticFiles at /uploads.
File type is validated via magic bytes (not just the Content-Type header).
"""
import os
import uuid
import filetype
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from auth.dependencies import require_teacher

UPLOAD_BASE = os.path.join(os.path.dirname(__file__), "..", "uploads")
AUDIO_DIR = os.path.join(UPLOAD_BASE, "audio")
IMAGE_DIR = os.path.join(UPLOAD_BASE, "images")

ALLOWED_AUDIO = {"audio/mpeg", "audio/x-wav", "audio/ogg", "audio/flac"}
ALLOWED_IMAGE = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_AUDIO_MB = 20
MAX_IMAGE_MB = 5

router = APIRouter(prefix="/api/uploads", tags=["Uploads"])


@router.post("/audio")
async def upload_audio(
    file: UploadFile = File(...),
    _current_user=Depends(require_teacher),
):
    """Upload an audio file (mp3 / wav). Returns the URL path."""
    content = await file.read()

    if len(content) / (1024 * 1024) > MAX_AUDIO_MB:
        raise HTTPException(status_code=400, detail=f"File too large (max {MAX_AUDIO_MB} MB)")

    # Validate via magic bytes — not the spoofable Content-Type header
    kind = filetype.guess(content)
    if kind is None or kind.mime not in ALLOWED_AUDIO:
        detected = kind.mime if kind else "unknown"
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type detected: {detected}. Allowed: mp3, wav, ogg, flac",
        )

    os.makedirs(AUDIO_DIR, exist_ok=True)
    filename = f"{uuid.uuid4()}.{kind.extension}"
    with open(os.path.join(AUDIO_DIR, filename), "wb") as f:
        f.write(content)

    return {"url": f"/uploads/audio/{filename}", "filename": filename}


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    _current_user=Depends(require_teacher),
):
    """Upload an image for an MCQ option (jpg / png / gif / webp). Returns the URL path."""
    content = await file.read()

    if len(content) / (1024 * 1024) > MAX_IMAGE_MB:
        raise HTTPException(status_code=400, detail=f"File too large (max {MAX_IMAGE_MB} MB)")

    # Validate via magic bytes — not the spoofable Content-Type header
    kind = filetype.guess(content)
    if kind is None or kind.mime not in ALLOWED_IMAGE:
        detected = kind.mime if kind else "unknown"
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type detected: {detected}. Allowed: jpg, png, gif, webp",
        )

    os.makedirs(IMAGE_DIR, exist_ok=True)
    filename = f"{uuid.uuid4()}.{kind.extension}"
    with open(os.path.join(IMAGE_DIR, filename), "wb") as f:
        f.write(content)

    return {"url": f"/uploads/images/{filename}", "filename": filename}
