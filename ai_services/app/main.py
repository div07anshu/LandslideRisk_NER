from fastapi import FastAPI
from app.api.routes.risk import router as risk_router

app = FastAPI()
app.include_router(risk_router)

@app.get("/health")
def health_check():
    return {
        "status" : "ok",
        "service" : "ai_service",
    }