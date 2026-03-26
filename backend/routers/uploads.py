"""
File upload endpoints.
Files are saved to backend/uploads/ and served via StaticFiles at /uploads.
File type is validated via magic bytes (not just the Content-Type header).
"""
import os
import uuid
import filetype
import cloudinary
import cloudinary.uploader
from config import settings
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from auth.dependencies import require_teacher

ALLOWED_AUDIO = {"audio/mpeg", "audio/x-wav", "audio/ogg", "audio/flac", "audio/mp4", "video/mp4", "application/mp4"}
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
            detail=f"Invalid file type detected: {detected}. Allowed: mp3, m4a, wav, ogg, flac",
        )

    # Upload to Cloudinary (audio is handled as resource_type='video' in Cloudinary)
    try:
        result = cloudinary.uploader.upload(
            content,
            resource_type="video",
            folder="academic_system/audio"
        )
        return {"url": result["secure_url"], "filename": result["public_id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload to Cloudinary: {str(e)}")


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

    # Upload to Cloudinary
    try:
        result = cloudinary.uploader.upload(
            content,
            resource_type="image",
            folder="academic_system/images"
        )
        return {"url": result["secure_url"], "filename": result["public_id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload to Cloudinary: {str(e)}")
