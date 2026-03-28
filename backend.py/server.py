"""
FastAPI proxy server — keeps the Gemini API key server-side.
Run: uvicorn server:app --reload --port 8000
"""

import os
import re
import json
from dotenv import load_dotenv
import google.genai as genai
from google.genai import types
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yfinance as yf
import pandas as pd

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if not GEMINI_API_KEY:
    print("⚠️  GEMINI_API_KEY not set — run: export GEMINI_API_KEY='your-key'")

client = genai.Client(api_key=GEMINI_API_KEY)

app = FastAPI(title="Quanta Proxy")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


def extract_tickers(text: str) -> set:
    """Extract stock tickers (4-letter uppercase symbols) from text."""
    # Match 1-4 letter uppercase symbols with word boundaries
    pattern = r'\b([A-Z]{1,4})\b'
    matches = re.findall(pattern, text)
    # Filter out common words that aren't stock tickers
    common_words = {'A', 'I', 'THE', 'AND', 'OR', 'IF', 'IS', 'ON', 'TO', 'UP', 'BY', 'AT', 'BE', 'IT', 'AS', 'THIS', 'THAT', 'WITH', 'FOR', 'YOU', 'NOT', 'BUT', 'FROM', 'CAN', 'DO', 'GET', 'GO', 'HAS', 'HE', 'IN', 'NO', 'SO', 'US', 'WE', 'MY', 'ME', 'VS', 'WHAT', 'WHO', 'WHY', 'HOW', 'WHEN', 'WHERE', 'WHICH', 'THAT'}
    return {m.upper() for m in matches if m.upper() not in common_words}


def fetch_stock_data(ticker: str) -> dict:
    """Fetch live stock data from yfinance."""
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        hist = stock.history(period="1d")
        
        if hist.empty or not info:
            return None
        
        current_price = float(info.get('currentPrice', hist['Close'].iloc[-1]))
        prev_close = float(info.get('previousClose', hist['Open'].iloc[-1]))
        change = current_price - prev_close
        change_pct = (change / prev_close * 100) if prev_close != 0 else 0
        
        return {
            'ticker': ticker,
            'price': current_price,
            'change': change,
            'change_pct': change_pct,
            'market_cap': info.get('marketCap'),
            'pe_ratio': info.get('trailingPE'),
            '52_week_high': info.get('fiftyTwoWeekHigh'),
            '52_week_low': info.get('fiftyTwoWeekLow'),
            'volume': info.get('volume'),
        }
    except Exception as e:
        print(f"Failed to fetch data for {ticker}: {e}")
        return None


def format_stock_data(stocks_data: list) -> str:
    """Format multiple stock data into a readable context string."""
    if not stocks_data:
        return ""
    
    context = "LIVE STOCK DATA:\n"
    for stock in stocks_data:
        if stock:
            context += f"\n{stock['ticker']}:\n"
            context += f"  Price: ${stock['price']:.2f}\n"
            context += f"  Change: {stock['change']:+.2f} ({stock['change_pct']:+.2f}%)\n"
            if stock.get('market_cap'):
                context += f"  Market Cap: {stock['market_cap']}\n"
            if stock.get('pe_ratio'):
                context += f"  P/E Ratio: {stock['pe_ratio']:.2f}\n"
    
    return context


class ChatRequest(BaseModel):
    messages: list   # [{role: "user"|"assistant", content: "..."}]
    system: str = ""
    current_ticker: str = None  # Current stock being viewed


@app.options("/api/stock/{symbol}")
async def options_stock_data(symbol: str):
    """Handle CORS preflight requests for stock data endpoint."""
    return {}


@app.get("/api/stock/{symbol}")
async def get_stock_data(symbol: str):
    """Fetch live stock data for a single symbol from yfinance."""
    if not symbol or len(symbol) > 5 or not symbol.isupper():
        raise HTTPException(status_code=400, detail="Invalid symbol format")
    
    try:
        stock = yf.Ticker(symbol)
        info = stock.info
        hist = stock.history(period="3mo")
        
        if hist.empty:
            raise HTTPException(status_code=404, detail=f"No data found for {symbol}")
        
        # Extract OHLCV candles
        candles = []
        for date, row in hist.iterrows():
            candles.append({
                "date": date.strftime("%b %d"),
                "open": float(row["Open"]) if not pd.isna(row["Open"]) else None,
                "high": float(row["High"]) if not pd.isna(row["High"]) else None,
                "low": float(row["Low"]) if not pd.isna(row["Low"]) else None,
                "close": float(row["Close"]),
                "volume": int(row["Volume"]) if not pd.isna(row["Volume"]) else 0,
            })
        
        current_price = float(info.get('currentPrice') or hist['Close'].iloc[-1])
        prev_close = float(info.get('previousClose') or hist['Open'].iloc[0])
        
        return {
            "symbol": symbol,
            "candles": candles,
            "price": current_price,
            "prevClose": prev_close,
            "dayHigh": float(info.get('dayHigh') or 0),
            "dayLow": float(info.get('dayLow') or 0),
            "volume": int(info.get('volume') or 0),
            "marketCap": info.get('marketCap'),
            "pe": info.get('trailingPE'),
            "w52h": info.get('fiftyTwoWeekHigh'),
            "w52l": info.get('fiftyTwoWeekLow'),
            "name": info.get('longName') or info.get('shortName') or symbol,
            "sector": info.get('sector') or "—",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch data: {str(e)}")


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

    # System prompt already contains all live data from the frontend — no need to re-fetch
    enhanced_system = req.system or ""

    # Convert to Gemini Content format (role "assistant" → "model")
    contents = [
        types.Content(
            role="model" if m["role"] == "assistant" else "user",
            parts=[types.Part(text=m["content"])]
        )
        for m in req.messages
    ]

    config = types.GenerateContentConfig(
        system_instruction=enhanced_system or None,
        max_output_tokens=1536,
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
