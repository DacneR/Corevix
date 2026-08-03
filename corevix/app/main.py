from fastapi import FastAPI

from app.api.routes import router

from app.core.config import settings
from app.core.logger import logger

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Plataforma de administración y monitoreo de redes locales.",
    version=settings.VERSION
)

app.include_router(router)

logger.info("Corevix iniciado correctamente.")