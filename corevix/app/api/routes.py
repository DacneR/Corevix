from datetime import datetime

from fastapi import APIRouter

from app.core.config import settings


router = APIRouter()


@router.get("/", tags=["Sistema"])
def root():
    return {
        "project": "Corevix",
        "status": "running",
        "version": "1.0.0"
    }


@router.get("/health", tags=["Sistema"])
def health():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": datetime.now().isoformat()
    }