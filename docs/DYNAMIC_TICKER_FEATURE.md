# Dynamic Stock Ticker Detection

## Problem Solved
When asking follow-up questions mentioning different stocks (e.g., "compare NVDA to AAPL"), the AI now automatically fetches live data for any stocks mentioned in the question, not just the currently selected one.

## How It Works

### Backend (server.py)

1. **`extract_tickers(text: str) -> set`**
   - Extracts 1-4 letter uppercase symbols from user messages
   - Filters out common English words (THE, AND, IF, etc.)
   - Example: "compare NVDA to AAPL" → {NVDA, AAPL}

2. **`fetch_stock_data(ticker: str) -> dict`**
   - Uses yfinance to get live stock data
   - Returns: price, change, change_pct, market_cap, pe_ratio, 52-week high/low, volume

3. **`format_stock_data(stocks_data: list) -> str`**
   - Formats multiple stocks into readable context string
   - Appended to system prompt for Gemini

4. **Updated `/api/chat` endpoint**
   - Extracts tickers from user's latest message
   - Includes `current_ticker` (currently viewed stock)
   - Fetches live data for all mentioned stocks
   - Enhances system prompt with live data context
   - Gemini now has complete information to answer comparisons

### Frontend Updates

1. **gemini.js**
   - `askClaude()` now accepts `currentTicker` parameter
   - Passes it to backend as `current_ticker`

2. **useChat.js**
   - Both `askClaude()` calls now pass `sym` (current stock ticker)
   - Automatically included in every chat request

## Example Flow

**User:** "I'm viewing NVDA, now asking 'how does it compare to AAPL?'"

1. ✅ Backend extracts: {NVDA, AAPL}
2. ✅ Fetches live data for both stocks
3. ✅ Builds enhanced system prompt with both datasets
4. ✅ Sends to Gemini with full context
5. ✅ AI can now accurately compare them

## Benefits

- No more "I don't have live data for AAPL" errors
- Users can ask "compare this to TSLA, AMD, and GOOG" → all data fetched
- Automatic ticker detection works for any stock mentioned
- Limits to 5 stocks max per request to avoid API spam
