# Quanta — AI Trading Terminal

A real-time paper trading terminal powered by live Yahoo Finance data and Gemini AI. Built with React (Vite) on the frontend and FastAPI on the backend.

---

## Features

- **Live market data** — prices, OHLCV candles, market cap, P/E, 52-week range via Yahoo Finance
- **AI trading assistant** — Gemini 2.5 Flash analyzes stocks and gives BUY / HOLD / SELL verdicts using live data in context
- **Interactive chart** — animated line chart with SMA20/SMA50 overlays and hover tooltips
- **Paper trading** — buy/sell stocks with $100,000 virtual cash, track positions and P&L
- **Watchlist ticker** — scrolling live ticker for NVDA, AAPL, TSLA, MSFT, META, AMZN, GOOGL, SPY
- **Trade log** — full history of every executed trade
- **60s data cache** — Yahoo Finance responses cached client-side to avoid redundant fetches
- **Secure API proxy** — Gemini API key stays on the server, never exposed to the browser

---

## Project Structure

```
Nthshack26/
├── server.py                  # FastAPI proxy — /api/chat → Gemini 2.5 Flash
├── .env                       # API keys (gitignored)
├── backend/
│   └── main.py                # Standalone CLI stock analyzer (Gemini + yfinance)
└── src/
    ├── index.css              # Global styles + animations
    ├── App.jsx                # Root component — wires hooks and panels
    ├── api/
    │   ├── gemini.js          # Frontend fetch to /api/chat proxy
    │   └── yahoo.js           # Yahoo Finance fetcher with 60s TTL cache
    ├── hooks/
    │   ├── useWatchlist.js    # Loads all 8 watchlist symbols
    │   ├── useStockData.js    # Single symbol data + error state
    │   ├── usePortfolio.js    # Cash, positions, trade log, buy/sell logic
    │   └── useChat.js         # Chat messages, input, Gemini system prompt
    └── components/
        ├── Ticker.jsx         # Scrolling live price ticker bar
        ├── NavBar.jsx         # Logo, symbol pills, portfolio badge
        ├── ChatPanel.jsx      # AI chat UI with suggestions
        ├── MainContent.jsx    # Chart, Positions, Trade Log tabs
        ├── Chart.jsx          # SVG line chart with SMA overlays
        ├── Spark.jsx          # Mini sparkline for position cards
        ├── Counter.jsx        # Animated number counter
        ├── Glass.jsx          # Glassmorphism card wrapper
        ├── Pill.jsx           # Tab/filter pill button
        └── Stat.jsx           # Label + value stat display
```

---

## Setup

### Prerequisites

- Node.js 18+
- Python 3.10+
- A [Google AI Studio](https://ai.google.dev/) Gemini API key

### 1. Clone

```bash
git clone https://github.com/Arths17/Nthshack26.git
cd Nthshack26
```

### 2. Backend

```bash
pip install fastapi uvicorn google-genai python-dotenv
```

Create a `.env` file in the project root:

```
GEMINI_API_KEY=your_key_here
```

Start the server:

```bash
uvicorn server:app --reload --port 8000
```

The proxy will be running at `http://localhost:8000`. You can verify it at `http://localhost:8000/docs`.

### 3. Frontend

```bash
npm install
npm run dev
```

**Single Vercel project (recommended):** Connect [the GitHub repo](https://github.com/Arths17/quanta-ai) in the Vercel dashboard. This app deploys **Next.js + FastAPI** together: browser calls use the `/api/py/*` prefix so Next.js does not swallow `/api/*`. Production rewrites `/api/py/*` to the Python serverless entry (`api/index.py`). Set `GEMINI_API_KEY` in Vercel **project** environment variables (server-only, not `NEXT_PUBLIC_*`). After deploy, sanity-check: `curl -sS "https://<your-project>.vercel.app/api/py/stock/NVDA?timeframe=3M" | head -c 200`.

**Split hosting (optional):** Deploy FastAPI elsewhere (Railway, Render, etc.), then set `NEXT_PUBLIC_API_URL` to that origin. Routes on the backend are still under `/api/py/...`.

Note: Do NOT expose `GEMINI_API_KEY` in frontend envs; keep it server-side.
The repo now includes a Next.js frontend. Development still works with Vite, but production builds should use Next.

Local dev notes:
- Vite dev server (legacy): `npm run vite:dev` (runs on 5173)
- Next dev server (current default): `npm run dev` (Next)

Local Next proxies `/api/py/*` to `http://127.0.0.1:8000` when uvicorn is running. Leave `NEXT_PUBLIC_API_URL` unset for that flow, or point it at a non-loopback API if the UI and API are on different hosts.

---

## Usage

| Action | How |
|--------|-----|
| Switch stock | Click any symbol in the nav bar or ticker |
| Ask the AI | Type in the chat panel — ask for analysis, strategy, or a buy/sell verdict |
| Buy / Sell | Set quantity in the Chart tab and click Buy or Sell |
| Refresh data | Click ↺ Refresh to bypass cache and reload |
| View positions | Click the Positions tab |
| View trade history | Click the Trade Log tab |

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite |
| Styling | Inline styles + CSS animations (no framework) |
| Charts | SVG (hand-rolled) |
| AI | Gemini 2.5 Flash via Google GenAI SDK |
| Backend | FastAPI + Uvicorn |
| Market data | Yahoo Finance (via corsproxy.io) |

---

## Linting & Formatting

- **JavaScript/React**: Run `npx eslint .` to lint, `npx prettier --check .` to check formatting, and `npx prettier --write .` to auto-format.
- **Python**: Run `flake8 .` to lint Python files.
- **EditorConfig**: Most editors will auto-detect `.editorconfig` for consistent indentation.

---

## Testing

- **Frontend**: Example test in `src/utils/validation.test.js` (run with your preferred test runner, e.g., Jest).
- **Backend**: Add tests using `pytest` or similar for API endpoints and logic.
