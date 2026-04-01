"""
FastAPI proxy server — keeps the Gemini API key server-side.
Run: uvicorn server:app --reload --port 8000
"""

import json
import logging
import os
import re
from pathlib import Path
from typing import Any, Awaitable, Callable, Dict, List, Optional, Sequence, Set, cast

import pandas as pd
import yfinance as yf  # type: ignore[reportMissingTypeStubs]
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.responses import Response
from pydantic import BaseModel

try:
    import google.generativeai as genai  # type: ignore[reportMissingTypeStubs]
except Exception:  # pragma: no cover - dependency guard
    genai = None

if genai is not None:
    genai = cast(Any, genai)

try:
    # Prefer absolute import when running as a script/process from the backend folder
    from news_scraper import scraper
except Exception:  # pragma: no cover - fallback when executed as a package
    from .news_scraper import scraper


# -------------------------------------------------------------
# Environment
# -------------------------------------------------------------
def _load_env_files() -> None:
    """Load .env from likely locations regardless of launch directory."""
    here = Path(__file__).resolve().parent
    candidates = [
        Path.cwd() / ".env",      # when started from project root
        here / ".env",            # when backend keeps its own .env
        here.parent / ".env",     # repo root .env
    ]

    seen: Set[str] = set()
    for env_path in candidates:
        p = str(env_path)
        if p in seen:
            continue
        seen.add(p)
        if env_path.exists():
            load_dotenv(dotenv_path=env_path, override=False)


_load_env_files()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip().strip('"').strip("'")
if genai is not None:
    try:
        genai.configure(api_key=GEMINI_API_KEY or None)
    except Exception:
        pass
elif not GEMINI_API_KEY:
    print("Warning: google-generativeai not installed and GEMINI_API_KEY not set")

# -------------------------------------------------------------
# Data
# -------------------------------------------------------------
POPULAR_STOCKS: Dict[str, Dict[str, str]] = {
    "AAPL": {"name": "Apple", "sector": "Technology"},
    "MSFT": {"name": "Microsoft", "sector": "Technology"},
    "GOOGL": {"name": "Google", "sector": "Technology"},
    "NVDA": {"name": "NVIDIA", "sector": "Technology"},
    "META": {"name": "Meta", "sector": "Technology"},
    "TSLA": {"name": "Tesla", "sector": "Automotive"},
    "AMZN": {"name": "Amazon", "sector": "Technology"},
}

# Fallback candles used when yfinance is unavailable (keeps tests deterministic)
FALLBACK_CANDLES: List[Dict[str, Any]] = [
    {"date": "Jan 01", "open": 118.0, "high": 125.0, "low": 116.5, "close": 123.5, "volume": 1200000},
    {"date": "Jan 02", "open": 123.5, "high": 128.0, "low": 121.5, "close": 126.0, "volume": 950000},
    {"date": "Jan 03", "open": 126.0, "high": 129.0, "low": 124.5, "close": 128.5, "volume": 1010000},
]


# -------------------------------------------------------------
# FastAPI setup
# -------------------------------------------------------------
logger = logging.getLogger("uvicorn.error")

app = FastAPI(title="Quanta Proxy")


@app.get("/")
async def health_check() -> Dict[str, str]:
    return {"status": "ok"}


@app.middleware("http")
async def normalize_api_prefix_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    """Accept both /api/* and /api/py/* paths for deployment compatibility."""
    path = request.scope.get("path", "")
    if path == "/api/py":
        request.scope["path"] = "/api"
    elif path.startswith("/api/py/"):
        request.scope["path"] = "/api/" + path[len("/api/py/"):]
    return await call_next(request)


@app.middleware("http")
async def catch_exceptions_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    try:
        return await call_next(request)
    except Exception as exc:  # pragma: no cover - safety net
        logger.error(f"Unhandled error: {exc}", exc_info=True)
        return JSONResponse(status_code=500, content={"detail": "Internal server error. Please try again later."})


_EXTRA_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        *_EXTRA_ORIGINS,
    ],
    allow_methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
    allow_credentials=True,
)


# -------------------------------------------------------------
# Helpers
# -------------------------------------------------------------
def _static_stock_payload(symbol: str, timeframe: str) -> Optional[Dict[str, Any]]:
    if symbol not in POPULAR_STOCKS:
        return None
    price = 128.5
    prev_close = 123.5
    return {
        "symbol": symbol,
        "timeframe": timeframe,
        "candles": FALLBACK_CANDLES,
        "price": price,
        "prevClose": prev_close,
        "dayHigh": max(c["high"] for c in FALLBACK_CANDLES),
        "dayLow": min(c["low"] for c in FALLBACK_CANDLES),
        "volume": sum(c["volume"] for c in FALLBACK_CANDLES),
        "marketCap": None,
        "pe": None,
        "w52h": None,
        "w52l": None,
        "name": POPULAR_STOCKS[symbol]["name"],
        "sector": POPULAR_STOCKS[symbol]["sector"],
    }


def _validate_symbol(symbol: str) -> None:
    if not symbol or not symbol.isalpha() or len(symbol) > 5 or not symbol.isupper():
        raise HTTPException(status_code=400, detail="Invalid symbol format")


def _build_candles(hist: pd.DataFrame, date_fmt: str) -> List[Dict[str, Any]]:
    candles: List[Dict[str, Any]] = []
    for date_raw, row in hist.iterrows():
        date = cast(pd.Timestamp, date_raw)
        candles.append({
            "date": date.strftime(date_fmt),
            "open": float(row["Open"]) if not pd.isna(row["Open"]) else None,
            "high": float(row["High"]) if not pd.isna(row["High"]) else None,
            "low": float(row["Low"]) if not pd.isna(row["Low"]) else None,
            "close": float(row["Close"]),
            "volume": int(row["Volume"]) if not pd.isna(row["Volume"]) else 0,
        })
    return candles


# -------------------------------------------------------------
# API endpoints
# -------------------------------------------------------------
@app.get("/api/stocks")
async def get_popular_stocks() -> Dict[str, List[Dict[str, str]]]:
    return {
        "stocks": [
            {"symbol": symbol, "name": data["name"], "sector": data["sector"]}
            for symbol, data in POPULAR_STOCKS.items()
        ]
    }


@app.get("/api/stock/{symbol}")
async def get_stock_data(symbol: str, timeframe: str = Query("3M")) -> Dict[str, Any]:
    _validate_symbol(symbol)

    timeframe_config: Dict[str, Dict[str, str]] = {
        "1D": {"period": "1d", "interval": "60m", "date_fmt": "%H:%M"},
        "1W": {"period": "7d", "interval": "1h", "date_fmt": "%a %H:%M"},
        "5D": {"period": "5d", "interval": "60m", "date_fmt": "%b %d %H:%M"},
        "1M": {"period": "1mo", "interval": "1d", "date_fmt": "%b %d"},
        "3M": {"period": "3mo", "interval": "1d", "date_fmt": "%b %d"},
        "6M": {"period": "6mo", "interval": "1d", "date_fmt": "%b %d"},
        "1Y": {"period": "1y", "interval": "1wk", "date_fmt": "%b %d"},
        "5Y": {"period": "5y", "interval": "1mo", "date_fmt": "%b %Y"},
        "MAX": {"period": "max", "interval": "1mo", "date_fmt": "%b %Y"},
    }

    tf = (timeframe or "3M").upper()
    if tf not in timeframe_config:
        allowed = ", ".join(timeframe_config.keys())
        raise HTTPException(status_code=400, detail=f"Invalid timeframe. Allowed values: {allowed}")

    selected = timeframe_config[tf]
    try:
        stock: Any = yf.Ticker(symbol)
        info: Dict[str, Any] = dict(stock.info or {})
        hist: pd.DataFrame = stock.history(period=selected["period"], interval=selected["interval"])
        if hist.empty:
            raise HTTPException(status_code=404, detail=f"No data found for {symbol}")

        candles = _build_candles(hist, selected["date_fmt"])
        current_price = float(info.get("currentPrice") or float(hist["Close"].iloc[-1]))
        prev_close = float(info.get("previousClose") or float(hist["Open"].iloc[0]))

        return {
            "symbol": symbol,
            "timeframe": tf,
            "candles": candles,
            "price": current_price,
            "prevClose": prev_close,
            "dayHigh": float(info.get("dayHigh") or 0),
            "dayLow": float(info.get("dayLow") or 0),
            "volume": int(info.get("volume") or 0),
            "marketCap": info.get("marketCap"),
            "pe": info.get("trailingPE"),
            "w52h": info.get("fiftyTwoWeekHigh"),
            "w52l": info.get("fiftyTwoWeekLow"),
            "name": info.get("longName") or info.get("shortName") or symbol,
            "sector": info.get("sector") or POPULAR_STOCKS.get(symbol, {}).get("sector", "—"),
        }
    except HTTPException:
        raise
    except Exception:
        logger.exception(f"Error fetching stock data for {symbol}; falling back to static payload")
        fallback = _static_stock_payload(symbol, tf)
        if fallback:
            return fallback
        raise HTTPException(status_code=502, detail="Market data provider error")


class StrategyRequest(BaseModel):
    text: str


@app.post("/api/strategy")
async def parse_strategy(req: StrategyRequest) -> Dict[str, Any]:
    if not GEMINI_API_KEY or genai is None:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    prompt = f"""
You are a trading strategy parser. Convert the user's strategy description into a JSON object.

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
- "buy when EMA12 crosses above EMA26, sell when it crosses below" -> entry type "ema_cross_above" fast=12 slow=26, exit type "ema_cross_below" fast=12 slow=26
- "buy when RSI drops below 30, sell when RSI goes above 70" -> entry type "rsi_below" threshold=30, exit type "rsi_above" threshold=70
- "buy when price crosses above SMA50, sell with 5% stop loss" -> entry type "price_above_sma" period=50, exit type "stop_loss", stopLoss=0.05
"""

    models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
    last_err: Optional[Exception] = None

    for model_name in models:
        try:
            model: Any = genai.GenerativeModel(model_name)  # type: ignore[attr-defined]
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(max_output_tokens=512),  # type: ignore[attr-defined]
            )
            raw = response.text.strip()
            raw = re.sub(r"^```[a-z]*\n?", "", raw)
            raw = re.sub(r"\n?```$", "", raw)
            return json.loads(raw)
        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail="Strategy parse failed: invalid JSON from model")
        except Exception as err:  # pragma: no cover - model/runtime failures
            last_err = err
            logger.error(f"Strategy model {model_name} failed: {err}")
            continue

    raise HTTPException(status_code=500, detail=f"Strategy parse failed: all models unavailable. Last error: {str(last_err)[:120]}")


class ChatRequest(BaseModel):
    messages: Sequence[Dict[str, str]]
    system: str = ""
    current_ticker: Optional[str] = None


@app.post("/api/chat")
async def chat(req: ChatRequest) -> Dict[str, str]:
    if not GEMINI_API_KEY or genai is None:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured on server")

    enhanced_system = req.system or ""
    models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
    last_err: Optional[Exception] = None

    for model_name in models:
        try:
            model: Any = genai.GenerativeModel(model_name, system_instruction=enhanced_system or None)  # type: ignore[attr-defined]
            response = model.generate_content(
                [
                    {"role": m["role"] if m["role"] == "user" else "model", "parts": [m["content"]]}
                    for m in req.messages
                ],
                generation_config=genai.types.GenerationConfig(max_output_tokens=1536),  # type: ignore[attr-defined]
            )
            return {"text": response.text}
        except Exception as err:  # pragma: no cover - model/runtime failures
            last_err = err
            logger.error(f"Model {model_name} failed: {err}")
            continue

    raise HTTPException(status_code=500, detail=f"All models failed. Last error: {str(last_err)[:150]}")


# -------------------------------------------------------------
# News endpoints
# -------------------------------------------------------------
@app.get("/api/news/stock/{symbol}")
async def get_stock_news(symbol: str) -> Dict[str, Any]:
    try:
        symbol = symbol.upper()
        articles = scraper.fetch_stock_news(symbol)
        for article in articles:
            article["sentiment"] = scraper.analyze_sentiment(article["title"], article["description"])
        return {"articles": articles, "symbol": symbol}
    except Exception as exc:  # pragma: no cover - external dependency
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/news/market")
async def get_market_news() -> Dict[str, Any]:
    try:
        articles = scraper.fetch_market_news()
        for article in articles:
            article["sentiment"] = scraper.analyze_sentiment(article["title"], article["description"])
        return {"articles": articles}
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/news/trending")
async def get_trending_news() -> Dict[str, Any]:
    try:
        market_news = scraper.fetch_market_news()[:10]
        for article in market_news:
            article["sentiment"] = scraper.analyze_sentiment(article["title"], article["description"])
        return {"articles": market_news, "type": "trending"}
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=str(exc))


# -------------------------------------------------------------
# /api/py compatibility wrappers
# -------------------------------------------------------------
@app.options("/api/py/stock/{symbol}")
async def options_stock_data_py(symbol: str) -> Dict[str, str]:
    return {}


@app.get("/api/py/stocks")
async def get_popular_stocks_py() -> Dict[str, List[Dict[str, str]]]:
    return await get_popular_stocks()


@app.get("/api/py/stock/{symbol}")
async def get_stock_data_py(symbol: str, timeframe: str = Query("3M")) -> Dict[str, Any]:
    return await get_stock_data(symbol, timeframe)


@app.post("/api/py/strategy")
async def parse_strategy_py(req: StrategyRequest) -> Dict[str, Any]:
    return await parse_strategy(req)


@app.post("/api/py/chat")
async def chat_py(req: ChatRequest) -> Dict[str, str]:
    return await chat(req)
