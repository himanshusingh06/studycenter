import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends, Request
from app.core.config import settings
from app.core.permissions import get_current_user
from app.models.user import User

router = APIRouter(prefix="/uploads", tags=["File Uploads"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".pdf"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

@router.post("")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type '{ext}'. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    unique_filename = f"{uuid.uuid4().hex}{ext}"
    target_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum allowed limit of 10MB"
        )

    with open(target_path, "wb") as f:
        f.write(contents)

    base_url = str(request.base_url).rstrip("/")
    full_url = f"{base_url}/uploads/{unique_filename}"
    return {
        "filename": filename,
        "saved_as": unique_filename,
        "url": full_url,
        "relative_url": f"/uploads/{unique_filename}"
    }
