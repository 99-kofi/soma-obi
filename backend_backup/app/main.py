from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
import os

load_dotenv()

from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from app.services.ai_engine import AIEngine
from app.services.tts_engine import TTSEngine
from app.services.auth import auth_service
from app.services.analytics import analytics_service

app = FastAPI(title="Blacko AI API")

# Initialize engines
ai_engine = AIEngine()
tts_engine = TTSEngine()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class ChatRequest(BaseModel):
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    message: str

class ChatResponse(BaseModel):
    response: str
    audio_url: Optional[str] = None
    session_id: str
    user_id: str

# Endpoints
@app.get("/")
async def root():
    return {"message": "Blacko AI API is running"}

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    # Auth / Session Mgmt
    session_id = request.session_id
    user_id = request.user_id
    
    if not session_id:
        session_id, user_id = auth_service.create_anonymous_session(user_id)
        analytics_service.track_event("session_start", user_id)

    # AI Logic
    ai_response = await ai_engine.get_response(request.message)
    
    # Analytics
    analytics_service.track_event("prompt_sent", user_id)

    return {
        "response": ai_response,
        "audio_url": None, # Will be set once TTS is fully triggered
        "session_id": session_id,
        "user_id": user_id
    }

@app.get("/analytics/summary")
async def get_analytics():
    return analytics_service.get_summary()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
