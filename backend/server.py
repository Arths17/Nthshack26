"""
FastAPI proxy server — keeps the Gemini API key server-side.
Run: uvicorn server:app --reload --port 8000
"""

import os
import re
import json
from dotenv import load_dotenv
from collections.abc import Iterable
import google.generativeai as genai  # type: ignore[import]
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yfinance as yf  # type: ignore[import]
import pandas as pd
from .news_scraper import scraper
import logging
from fastapi.responses import JSONResponse
from typing import Any, List, Dict, Optional, Set, Callable, Awaitable, cast

load_dotenv()

# Initialize logger early so helper functions can use it during module import
logger = logging.getLogger("uvicorn.error")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if not GEMINI_API_KEY:
    print("⚠️  GEMINI_API_KEY not set — run: export GEMINI_API_KEY='your-key'")

# Configure Gemini API with key (no-op if empty)
genai = cast(Any, genai)  # Treat the runtime `generativeai` module as `Any` for the type-checker so
                          # attribute access (which varies by installed runtime) doesn't raise Pylance
                          # errors in this dynamic code path.

if hasattr(genai, "configure"):
    try:
        genai.configure(api_key=GEMINI_API_KEY)
    except Exception:
        # If the runtime package surface differs, fail quietly — server can still run.
        pass

# Choose a compatible model at startup. We prefer recent Gemini flavors but will
# fall back to any model that advertises `generateContent` support, then to
# a conservative default.
PREFERRED_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "chat-bison-001",
    "text-bison-001",
]


def _choose_model() -> str:
    # Use getattr guards because the installed `google.generativeai` runtime
    # may not expose stable types that the typechecker recognizes.
    try:
        list_models_fn = getattr(genai, "list_models", None)
        available: List[Any] = []
        if callable(list_models_fn):
            try:
                res = list_models_fn()
                if isinstance(res, Iterable):
                    available = list(cast(Iterable[Any], res))
                else:
                    available = []
            except Exception as e:
                logger.warning("Could not call list_models: %s", e)
                available = []
    except Exception as e:
        logger.warning("Could not list models: %s", e)
        available = []

    available_names: Set[str] = {cast(str, getattr(m, "name", "")) for m in available}

    # Try preferred models first (normalize to models/ prefix)
    for p in PREFERRED_MODELS:
        candidate = p if p.startswith("models/") else f"models/{p}"
        if candidate in available_names:
            m = next((x for x in available if getattr(x, "name", None) == candidate), None)
            if m and "generateContent" in (getattr(m, "supported_generation_methods", []) or []):
                logger.info("Selected model: %s", getattr(m, "name", ""))
                return cast(str, getattr(m, "name", candidate))

    # Pick the first model that supports generateContent
    for m in available:
        if "generateContent" in (getattr(m, "supported_generation_methods", []) or []):
            logger.info("Auto-selected model: %s", getattr(m, "name", ""))
            return cast(str, getattr(m, "name", "models/text-bison-001"))

    # Final fallback
    logger.warning("No compatible models discovered; falling back to models/text-bison-001")
    return "models/text-bison-001"


SELECTED_MODEL_NAME: str = _choose_model()

# Popular stocks database
POPULAR_STOCKS = {
    'AAPL': {'name': 'Apple', 'sector': 'Technology'},
    'MSFT': {'name': 'Microsoft', 'sector': 'Technology'},
    'GOOGL': {'name': 'Google', 'sector': 'Technology'},
    'NVDA': {'name': 'NVIDIA', 'sector': 'Technology'},
    'META': {'name': 'Meta', 'sector': 'Technology'},
    'TSLA': {'name': 'Tesla', 'sector': 'Automotive'},
    'AMD': {'name': 'Advanced Micro Devices', 'sector': 'Technology'},
    'INTC': {'name': 'Intel', 'sector': 'Technology'},
    'AVGO': {'name': 'Broadcom', 'sector': 'Technology'},
    'MU': {'name': 'Micron Technology', 'sector': 'Technology'},
    'QCOM': {'name': 'Qualcomm', 'sector': 'Technology'},
    'CRM': {'name': 'Salesforce', 'sector': 'Technology'},
    'ADBE': {'name': 'Adobe', 'sector': 'Technology'},
    'NFLX': {'name': 'Netflix', 'sector': 'Media'},
    'AMZN': {'name': 'Amazon', 'sector': 'Technology'},
    'JPM': {'name': 'JPMorgan Chase', 'sector': 'Finance'},
    'BAC': {'name': 'Bank of America', 'sector': 'Finance'},
    'WFC': {'name': 'Wells Fargo', 'sector': 'Finance'},
    'GS': {'name': 'Goldman Sachs', 'sector': 'Finance'},
    'MS': {'name': 'Morgan Stanley', 'sector': 'Finance'},
    'BLK': {'name': 'BlackRock', 'sector': 'Finance'},
    'SCHW': {'name': 'Charles Schwab', 'sector': 'Finance'},
    'ICE': {'name': 'Intercontinental Exchange', 'sector': 'Finance'},
    'JNJ': {'name': 'Johnson & Johnson', 'sector': 'Healthcare'},
    'UNH': {'name': 'UnitedHealth Group', 'sector': 'Healthcare'},
    'PFE': {'name': 'Pfizer', 'sector': 'Pharma'},
    'MRK': {'name': 'Merck', 'sector': 'Pharma'},
    'AZN': {'name': 'AstraZeneca', 'sector': 'Pharma'},
    'ABBV': {'name': 'AbbVie', 'sector': 'Pharma'},
    'TMO': {'name': 'Thermo Fisher', 'sector': 'Healthcare'},
    'AMGN': {'name': 'Amgen', 'sector': 'Pharma'},
    'WMT': {'name': 'Walmart', 'sector': 'Retail'},
    'COST': {'name': 'Costco', 'sector': 'Retail'},
    'HD': {'name': 'Home Depot', 'sector': 'Retail'},
    'NKE': {'name': 'Nike', 'sector': 'Consumer'},
    'KO': {'name': 'Coca-Cola', 'sector': 'Consumer'},
    'PEP': {'name': 'PepsiCo', 'sector': 'Consumer'},
    'MCD': {'name': 'McDonald\'s', 'sector': 'Food'},
    'SBUX': {'name': 'Starbucks', 'sector': 'Food'},
    'XOM': {'name': 'ExxonMobil', 'sector': 'Energy'},
    'CVX': {'name': 'Chevron', 'sector': 'Energy'},
    'COP': {'name': 'ConocoPhillips', 'sector': 'Energy'},
    'EOG': {'name': 'EOG Resources', 'sector': 'Energy'},
    'MPC': {'name': 'Marathon Petroleum', 'sector': 'Energy'},
    'BA': {'name': 'Boeing', 'sector': 'Industrial'},
    'GE': {'name': 'General Electric', 'sector': 'Industrial'},
    'CAT': {'name': 'Caterpillar', 'sector': 'Industrial'},
    'LMT': {'name': 'Lockheed Martin', 'sector': 'Defense'},
    'RTX': {'name': 'Raytheon Technologies', 'sector': 'Defense'},
    'SPG': {'name': 'Simon Property', 'sector': 'Real Estate'},
    'AMT': {'name': 'American Tower', 'sector': 'Real Estate'},
    'PLD': {'name': 'Prologis', 'sector': 'Real Estate'},
    'NEE': {'name': 'NextEra Energy', 'sector': 'Utilities'},
    'DUK': {'name': 'Duke Energy', 'sector': 'Utilities'},
    'SO': {'name': 'Southern Company', 'sector': 'Utilities'},
    'VZ': {'name': 'Verizon', 'sector': 'Telecom'},
    'T': {'name': 'AT&T', 'sector': 'Telecom'},
    'CMCSA': {'name': 'Comcast', 'sector': 'Media'},
}

app = FastAPI(title="Quanta Proxy")


@app.get("/")
async def health_check() -> Dict[str, Any]:
    return {"status": "ok"}


@app.get("/api/env")
async def get_public_env() -> Dict[str, Any]:
    """Return safe public environment variables for client-side debugging.

    This intentionally excludes server-only secrets like `GEMINI_API_KEY`.
    """
    public = {
        "NEXT_PUBLIC_FIREBASE_API_KEY": os.getenv("NEXT_PUBLIC_FIREBASE_API_KEY") or os.getenv("VITE_FIREBASE_API_KEY"),
        "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN": os.getenv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN") or os.getenv("VITE_FIREBASE_AUTH_DOMAIN"),
        "NEXT_PUBLIC_FIREBASE_PROJECT_ID": os.getenv("NEXT_PUBLIC_FIREBASE_PROJECT_ID") or os.getenv("VITE_FIREBASE_PROJECT_ID"),
        "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET": os.getenv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET") or os.getenv("VITE_FIREBASE_STORAGE_BUCKET"),
        "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID": os.getenv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID") or os.getenv("VITE_FIREBASE_MESSAGING_SEND") or os.getenv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
        "NEXT_PUBLIC_FIREBASE_APP_ID": os.getenv("NEXT_PUBLIC_FIREBASE_APP_ID") or os.getenv("VITE_FIREBASE_APP_ID"),
        "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID": os.getenv("NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID") or os.getenv("VITE_FIREBASE_MEASUREMENT_ID"),
        "NEXT_PUBLIC_API_URL": os.getenv("NEXT_PUBLIC_API_URL") or os.getenv("VITE_API_URL"),
        "VERCEL_URL": os.getenv("VERCEL_URL"),
    }

    bucket = public.get("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET")
    suggested_bucket = None
    if bucket and bucket.endswith(".firebasestorage.app"):
        suggested_bucket = bucket.replace(".firebasestorage.app", ".appspot.com")

    return {"public_env": public, "recommended_storage_bucket": suggested_bucket}


@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next: Callable[[Request], Awaitable[Any]]) -> Any:
    try:
        return await call_next(request)
    except Exception as exc:
        logger.error(f"Unhandled error: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error. Please try again later."}
        )


# CORS configuration
_EXTRA_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]

_VERCEL_URL = os.getenv("VERCEL_URL")
if _VERCEL_URL:
    _vercel_origin = f"https://{_VERCEL_URL.strip()}"
    if _vercel_origin not in _EXTRA_ORIGINS:
        _EXTRA_ORIGINS.append(_vercel_origin)

_DEFAULT_LOCAL_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

allowed = _DEFAULT_LOCAL_ORIGINS + _EXTRA_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed,
    allow_methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
    allow_credentials=True,
)


def extract_tickers(text: str) -> Set[str]:
    """Extract stock tickers (1-4 uppercase letters) from text."""
    pattern = r'\b([A-Z]{1,4})\b'
    matches = re.findall(pattern, text)
    common_words = {
        'A', 'I', 'THE', 'AND', 'OR', 'IF', 'IS', 'ON', 'TO', 'UP', 'BY', 'AT', 'BE', 'IT', 'AS',
        'THIS', 'THAT', 'WITH', 'FOR', 'YOU', 'NOT', 'BUT', 'FROM', 'CAN', 'DO', 'GET', 'GO',
        'HAS', 'HE', 'IN', 'NO', 'SO', 'US', 'WE', 'MY', 'ME', 'VS',
        'WHAT', 'WHO', 'WHY', 'HOW', 'WHEN', 'WHERE', 'WHICH',
        'AM', 'AN', 'ARE', 'OF', 'THAN', 'THEN', 'THEY', 'THEM', 'THEIR', 'THESE', 'THOSE',
        'ABOUT', 'AFTER', 'BEFORE', 'BETWEEN', 'DURING', 'UNTIL', 'SINCE', 'THROUGH', 'INTO',
        'OVER', 'UNDER', 'ABOVE', 'BELOW', 'OUT', 'SUCH', 'OUR', 'ALL', 'EACH', 'EVERY',
        'FEW', 'MORE', 'MOST', 'OTHER', 'SOME', 'ANY', 'BEEN', 'HAVE', 'DOES', 'DID', 'WILL',
        'WOULD', 'COULD', 'SHOULD', 'MUST', 'MAY', 'MIGHT', 'SHALL', 'THAN',
        'BUY', 'SELL', 'LONG', 'SHORT', 'CALL', 'PUT', 'BULL', 'BEAR', 'RISK', 'GAIN', 'LOSS',
        'STOP', 'TAKE', 'PROFIT', 'MARGIN', 'PRICE', 'RATE', 'TERM', 'YEAR', 'MONTH', 'WEEK',
        'DAY', 'OPEN', 'CLOSE', 'HIGH', 'LOW', 'VOLUME', 'TRADE', 'ORDER', 'FILL', 'CHART',
    }
    return {m.upper() for m in matches if m.upper() not in common_words}


def fetch_stock_data(ticker: str) -> Optional[Dict[str, Any]]:
    """Fetch live stock data from yfinance."""
    try:
        stock: Any = yf.Ticker(ticker)
        info = cast(Dict[str, Any], getattr(stock, "info", {}) or {})
        hist: pd.DataFrame = stock.history(period="1d")
        # If no historical data or no info dictionary, bail out.
        if getattr(hist, "empty", True) or not info:
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


def format_stock_data(stocks_data: List[Optional[Dict[str, Any]]]) -> str:
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
    messages: List[Dict[str, Any]]
    system: str = ""
    current_ticker: Optional[str] = None


@app.options("/api/stock/{symbol}")
async def options_stock_data(symbol: str) -> Dict[str, Any]:
    return {}


@app.get("/api/stocks")
async def get_popular_stocks() -> Dict[str, Any]:
    return {
        'stocks': [
            {
                'symbol': symbol,
                'name': data['name'],
                'sector': data['sector']
            }
            for symbol, data in POPULAR_STOCKS.items()
        ]
    }


@app.get("/api/stock/{symbol}")
async def get_stock_data(symbol: str, timeframe: str = Query("3M")) -> Dict[str, Any]:
    if not symbol or len(symbol) > 5 or not symbol.isupper():
        raise HTTPException(status_code=400, detail="Invalid symbol format")

    timeframe_config = {
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
        info = cast(Dict[str, Any], getattr(stock, "info", {}) or {})
        hist: pd.DataFrame = stock.history(period=selected["period"], interval=selected["interval"])

        if getattr(hist, "empty", True):
            raise HTTPException(status_code=404, detail=f"No data found for {symbol}")

        candles: List[Dict[str, Any]] = []
        for date, row in hist.iterrows():
            # Guard against unknown index types (pandas.Timestamp vs other)
            date_any = cast(Any, date)
            dfmt = getattr(date_any, "strftime", None)
            if callable(dfmt):
                date_display = date_any.strftime(selected["date_fmt"])
            else:
                date_display = str(date_any)
            candles.append({
                "date": date_display,
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
            "timeframe": tf,
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
    text: str


@app.post("/api/strategy")
async def parse_strategy(req: StrategyRequest) -> Dict[str, Any]:
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    prompt = f"""You are a trading strategy parser. Convert the user's strategy description into a JSON object.

User strategy: "{req.text}"

Return ONLY valid JSON, no explanation, no markdown fences. Use this exact schema:
{   
  "name": "short strategy name",
  "entry": {
    "type": "ema_cross_above" | "sma_cross_above" | "rsi_below" | "price_above_ema" | "price_above_sma",
    "fast": <integer or null>,
    "slow": <integer or null>,
    "period": <integer or null>,
    "threshold": <number or null>
  },
  "exit": {
    "type": "ema_cross_below" | "sma_cross_below" | "rsi_above" | "price_below_ema" | "price_below_sma" | "stop_loss" | "take_profit",
    "fast": <integer or null>,
    "slow": <integer or null>,
    "period": <integer or null>,
    "threshold": <number or null>
  },
  "stopLoss": <decimal like 0.05 for 5%, or null>,
  "takeProfit": <decimal like 0.10 for 10%, or null>
}
"""

    # Try selected model first, then fall back to other available models that support generateContent.
    last_err: Optional[Exception] = None
    tried: List[str] = []

    def _available_candidates():
        # selected model first
        if SELECTED_MODEL_NAME:
            yield SELECTED_MODEL_NAME
        # then other listed models
        list_models_fn = getattr(genai, "list_models", None)
        if callable(list_models_fn):
            try:
                res = list_models_fn()
                if isinstance(res, Iterable):
                    for m in cast(Iterable[Any], res):
                        methods = cast(List[str], getattr(m, "supported_generation_methods", []) or [])
                        if "generateContent" in methods:
                            name = getattr(m, "name", None)
                            if name and name != SELECTED_MODEL_NAME:
                                yield name
            except Exception:
                pass
        # final fallback
        yield "models/text-bison-001"

    for model_name in _available_candidates():
        tried.append(model_name)
        try:
            gm_cls = getattr(genai, "GenerativeModel", None)
            if not gm_cls:
                # runtime doesn't expose the class we expect — try next candidate
                continue
            model = gm_cls(model_name)

            genai_types = getattr(genai, "types", None)
            gen_cfg = None
            if genai_types and getattr(genai_types, "GenerationConfig", None):
                try:
                    gen_cfg = genai_types.GenerationConfig(max_output_tokens=512)
                except Exception:
                    gen_cfg = None

            kwargs = {"generation_config": gen_cfg} if gen_cfg is not None else {}
            response = model.generate_content(prompt, **kwargs)

            raw = getattr(response, "text", "").strip()
            raw = re.sub(r"^```[a-z]*\n?", "", raw)
            raw = re.sub(r"\n?```$", "", raw)
            parsed = cast(Dict[str, Any], json.loads(raw))
            return parsed
        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail="Strategy parse failed: invalid JSON from model")
        except Exception as e:
            last_err = e
            logger.warning("Strategy generation failed with model %s: %s", model_name, e)
            continue

    raise HTTPException(status_code=500, detail=f"Strategy parse failed: all models unavailable. Tried: {tried}. Last error: {str(last_err)[:200]}")


@app.post("/api/chat")
async def chat(req: ChatRequest) -> Dict[str, Any]:
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured on server")

    enhanced_system = req.system or ""

    last_err: Optional[Exception] = None
    tried: List[str] = []

    def _chat_candidates():
        if SELECTED_MODEL_NAME:
            yield SELECTED_MODEL_NAME
        list_models_fn = getattr(genai, "list_models", None)
        if callable(list_models_fn):
            try:
                res = list_models_fn()
                if isinstance(res, Iterable):
                    for m in cast(Iterable[Any], res):
                        methods = cast(List[str], getattr(m, "supported_generation_methods", []) or [])
                        if "generateContent" in methods:
                            name = getattr(m, "name", None)
                            if name and name != SELECTED_MODEL_NAME:
                                yield name
            except Exception:
                pass
        yield "models/text-bison-001"

    for model_name in _chat_candidates():
        tried.append(model_name)
        try:
            gm_cls = getattr(genai, "GenerativeModel", None)
            if not gm_cls:
                continue
            model = gm_cls(
                model_name,
                system_instruction=enhanced_system if enhanced_system else None,
            )

            genai_types = getattr(genai, "types", None)
            gen_cfg = None
            if genai_types and getattr(genai_types, "GenerationConfig", None):
                try:
                    gen_cfg = genai_types.GenerationConfig(max_output_tokens=1536)
                except Exception:
                    gen_cfg = None

            kwargs = {"generation_config": gen_cfg} if gen_cfg is not None else {}
            messages: List[Dict[str, Any]] = req.messages
            payload: List[Dict[str, Any]] = [
                {"role": m.get("role") if m.get("role") == "user" else "model", "parts": [m.get("content", "") or ""]}
                for m in messages
            ]
            response = model.generate_content(payload, **kwargs)
            return {"text": getattr(response, "text", "")}
        except Exception as e:
            last_err = e
            logger.warning("Chat generation failed with model %s: %s", model_name, e)
            continue

    raise HTTPException(
        status_code=500,
        detail=f"All models failed. Tried: {tried}. Last error: {str(last_err)[:200]}"
    )


# News endpoints
@app.get("/api/news/stock/{symbol}")
async def get_stock_news(symbol: str) -> Dict[str, Any]:
    try:
        symbol = symbol.upper()
        articles = scraper.fetch_stock_news(symbol)
        for article in articles:
            article['sentiment'] = scraper.analyze_sentiment(article['title'], article['description'])
        return {"articles": articles, "symbol": symbol}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/news/market")
async def get_market_news() -> Dict[str, Any]:
    try:
        articles = scraper.fetch_market_news()
        for article in articles:
            article['sentiment'] = scraper.analyze_sentiment(article['title'], article['description'])
        return {"articles": articles}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/news/trending")
async def get_trending_news() -> Dict[str, Any]:
    try:
        market_news = scraper.fetch_market_news()[:10]
        for article in market_news:
            article['sentiment'] = scraper.analyze_sentiment(article['title'], article['description'])
        return {"articles": market_news, "type": "trending"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
