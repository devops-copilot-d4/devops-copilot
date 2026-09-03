import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_TITLE: str = "AI DevOps Copilot – AI Agent for Autonomous CI/CD Failure Prediction and Self-Healing"
    API_PORT: int = int(os.getenv("AI_SERVICE_PORT", "8000"))
    LLM_API_URL: str = os.getenv("LLM_API_URL", "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent")
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gemini-1.5-flash")
    
    @property
    def MODEL_PATH(self) -> str:
        if os.getenv("MODEL_PATH"):
            return os.getenv("MODEL_PATH")
        
        # Priority 1: Local ml folder inside ai-service (ai-service/ml/model.joblib or /app/ml/model.joblib)
        local_path = os.path.join(os.path.dirname(__file__), "ml", "model.joblib")
        if os.path.exists(local_path):
            return local_path
            
        # Priority 2: Root ml folder (../ml/model.joblib)
        root_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ml", "model.joblib")
        if os.path.exists(root_path):
            return root_path
            
        # Priority 3: Docker container standard path
        container_path = "/app/ml/model.joblib"
        if os.path.exists(container_path):
            return container_path
            
        return local_path
    
settings = Settings()
