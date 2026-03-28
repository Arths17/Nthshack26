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


class StrategyRequest(BaseModel):
    text: str   # raw user strategy description


@app.post("/api/strategy")
async def parse_strategy(req: StrategyRequest):
    """Parse a natural language strategy into structured JSON for the frontend backtester."""
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    prompt = f"""You are a trading strategy parser. Convert the user's strategy description into a JSON object.

User strategy: "{req.text}"

Return ONLY valid JSON, no explanation, no markdown fences. Use this exact schema:
{{
  "name": "short strategy name",
  "entry": {{
    "type": "ema_cross_above" | "sma_cross_above" | "rsi_below" | "price_above_ema" | "price_above_sma",
    "fast": <integer or null>,
    "slow": <integer or null>,
    "period": <integer or null>,
    "threshold": <number or null>
  }},
  "exit": {{
    "type": "ema_cross_below" | "sma_cross_below" | "rsi_above" | "price_below_ema" | "price_below_sma" | "stop_loss" | "take_profit",
    "fast": <integer or null>,
    "slow": <integer or null>,
    "period": <integer or null>,
    "threshold": <number or null>
  }},
  "stopLoss": <decimal like 0.05 for 5%, or null>,
  "takeProfit": <decimal like 0.10 for 10%, or null>
}}

Examples:
- "buy when EMA12 crosses above EMA26, sell when it crosses below" → entry type "ema_cross_above" fast=12 slow=26, exit type "ema_cross_below" fast=12 slow=26
- "buy when RSI drops below 30, sell when RSI goes above 70" → entry type "rsi_below" threshold=30, exit type "rsi_above" threshold=70
- "buy when price crosses above SMA50, sell with 5% stop loss" → entry type "price_above_sma" period=50, exit type "stop_loss", stopLoss=0.05"""

    contents = [types.Content(role="user", parts=[types.Part(text=prompt)])]
    config = types.GenerateContentConfig(max_output_tokens=512)

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash", contents=contents, config=config
        )
        import json, re
        raw = response.text.strip()
        # strip markdown fences if Gemini added them anyway
        raw = re.sub(r"^```[a-z]*\n?", "", raw)
        raw = re.sub(r"\n?```$", "", raw)
        parsed = json.loads(raw)
        return parsed
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Strategy parse failed: {e}")


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
        max_output_tokens=2048,
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
