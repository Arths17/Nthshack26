# Quanta Trading Terminal — Servers Running ✅

## Frontend Server
- **URL:** http://localhost:5173
- **Status:** Running (Vite dev server)
- **Command:** `npm run dev` (from project root)
- **Process:** Node.js on port 5173

## Backend Server
- **URL:** http://localhost:8000
- **Status:** Running (FastAPI/Uvicorn)
- **Command:** `cd backend && python -m uvicorn server:app --reload --port 8000`
- **Process:** Python on port 8000

## Available Endpoints

### /api/chat (POST)
- **Purpose:** Multi-turn AI chat with live stock data
- **Parameters:**
  - `messages`: Chat history [{role: "user"|"assistant", content: "..."}]
  - `system`: System prompt (optional)
  - `current_ticker`: Current stock symbol (auto-fetches live data)
- **Returns:** `{text: "AI response"}`

### /api/strategy (POST)
- **Purpose:** Parse natural language trading strategies
- **Parameters:**
  - `text`: Strategy description (e.g., "buy when EMA12 crosses above EMA26")
- **Returns:** `{name, entry, exit, stopLoss, takeProfit}`

### /api/health (GET)
- **Purpose:** Health check
- **Returns:** `{status: "ok", service: "Quanta Proxy"}`

## Dynamic Stock Data Feature

When you ask a follow-up question mentioning different stocks:

```
User: "I'm looking at NVDA. How does it compare to AAPL?"
Backend:
  1. Extracts: {NVDA, AAPL}
  2. Fetches live data for both
  3. Includes in system prompt
  4. AI responds with full context
```

## Frontend → Backend Communication

```javascript
// Frontend sends:
POST /api/chat
{
  messages: [{role: "user", content: "compare to AAPL"}],
  system: "... with live data ...",
  current_ticker: "NVDA"
}

// Backend responds with enhanced prompt including:
LIVE STOCK DATA:
  NVDA: Price $123.45, Change +1.23%
  AAPL: Price $178.90, Change -0.45%
```

## Testing the System

1. Open http://localhost:5173 in your browser
2. Select a stock (e.g., NVDA)
3. Ask a question: "What about AAPL?" or "Compare to TSLA"
4. Backend automatically fetches live data and provides context

## Troubleshooting

### Port 8000 in use
```bash
lsof -i :8000 | grep -v COMMAND | awk '{print $2}' | xargs kill -9
```

### Port 5173 in use
```bash
lsof -i :5173 | grep -v COMMAND | awk '{print $2}' | xargs kill -9
```

### Dependencies missing
```bash
rm -rf node_modules package-lock.json
npm install
```

### Python issues
```bash
source .venv/bin/activate
pip install -r requirements.txt
```

---

**Last Updated:** March 28, 2026
**Status:** All systems operational ✅
