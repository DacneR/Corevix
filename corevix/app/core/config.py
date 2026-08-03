from dataclasses import dataclass
from os import getenv

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    PROJECT_NAME: str = getenv("PROJECT_NAME", "Corevix")
    VERSION: str = getenv("VERSION", "1.0.0")

    HOST: str = getenv("HOST", "127.0.0.1")
    PORT: int = int(getenv("PORT", 8000))
    DEBUG: bool = getenv("DEBUG", "True") == "True"

    DATABASE_URL: str = getenv(
        "DATABASE_URL",
        "sqlite:///app/database/corevix.db"
    )

    SCAN_INTERVAL: int = int(getenv("SCAN_INTERVAL", 30))


settings = Settings()