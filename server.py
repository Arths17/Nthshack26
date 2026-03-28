"""
FastAPI proxy server — keeps the Gemini API key server-side.
Run: uvicorn server:app --reload --port 8000
"""

import os
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if not GEMINI_API_KEY:
    print("⚠️  GEMINI_API_KEY not set — run: export GEMINI_API_KEY='your-key'")

genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI(title="Quanta Proxy")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)


class ChatRequest(BaseModel):
    messages: list   # [{role: "user"|"assistant", content: "..."}]
    system: str = ""


@app.post("/api/chat")
async def chat(req: ChatRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured on server")

    # Convert message history to Gemini format (role "assistant" → "model")
    # Last message is sent via send_message; prior messages become history
    history = [
        {"role": "model" if m["role"] == "assistant" else "user", "parts": [m["content"]]}
        for m in req.messages[:-1]
    ]
    last_msg = req.messages[-1]["content"]

    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=req.system or None,
    )
    chat_session = model.start_chat(history=history)

    try:
        response = chat_session.send_message(last_msg)
        return {"text": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
