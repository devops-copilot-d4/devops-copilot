import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_TITLE: str = "AI DevOps Copilot – AI Agent for Autonomous CI/CD Failure Prediction and Self-Healing"
    API_PORT: int = int(os.getenv("AI_SERVICE_PORT", "8000"))
    LLM_API_URL: str = os.getenv("LLM_API_URL", "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent")
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gemini-1.5-flash")
    MODEL_PATH: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ml", "model.joblib")
    
settings = Settings()
