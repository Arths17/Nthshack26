"""
FastAPI proxy server — keeps the Gemini API key server-side.
Run: uvicorn server:app --reload --port 8000
"""

import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if not GEMINI_API_KEY:
    print("⚠️  GEMINI_API_KEY not set — run: export GEMINI_API_KEY='your-key'")

client = genai.Client(api_key=GEMINI_API_KEY)

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

    # Convert to Gemini Content format (role "assistant" → "model")
    contents = [
        types.Content(
            role="model" if m["role"] == "assistant" else "user",
            parts=[types.Part(text=m["content"])]
        )
        for m in req.messages
    ]

    config = types.GenerateContentConfig(
        system_instruction=req.system or None,
        max_output_tokens=1000,
    )

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
            config=config,
        )
        return {"text": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
