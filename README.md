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
├── backend.py/
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

App runs at `http://localhost:5173`. Make sure the backend is running first — the frontend calls `/api/chat` which Vite proxies to port 8000.

> **Vite proxy config** — add this to `vite.config.js` if not already present:
> ```js
> export default {
>   server: {
>     proxy: {
>       '/api': 'http://localhost:8000'
>     }
>   }
> }
> ```

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
