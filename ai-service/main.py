from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routers import predict, copilot

app = FastAPI(
    title=settings.PROJECT_TITLE,
    description="Autonomous AI Agent Microservice for CI/CD Failure Prediction & Self-Healing",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router)
app.include_router(copilot.router)

@app.get("/")
async def root():
    return {
        "service": "AI DevOps Copilot AI Service",
        "status": "online",
        "version": "1.0.0",
        "project": settings.PROJECT_TITLE,
        "endpoints": [
            "/predict",
            "/analyze-logs",
            "/copilot/analyze",
            "/docs"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.API_PORT, reload=True)
