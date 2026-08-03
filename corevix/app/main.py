from fastapi import FastAPI

app = FastAPI(
    title="Corevix API",
    description="Plataforma de administración y monitoreo de redes locales.",
    version="1.0.0"
)

@app.get("/")
def root():
    return {
        "project": "Corevix",
        "status": "running"
    }