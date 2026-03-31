# 🚀 News Feature - Quick Start Guide

## Installation (2 minutes)

### 1. Install Python packages
```bash
pip install requests beautifulsoup4 lxml fastapi uvicorn python-dotenv yfinance google-generativeai
```

Or use the requirements file:
```bash
pip install -r requirements.txt
```

### 2. Start the backend server
```bash
cd backend
uvicorn server:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

### 3. Open the app in browser
Navigate to your frontend URL (usually http://localhost:5173 for Vite)

## Usage (1 minute)

### View Stock News
1. Click "News" in the navigation
2. Select the default stock tab (shows current symbol)
3. See all recent news with sentiment indicators:
   - 🟢 **Green** = Positive news (bullish)
   - 🔴 **Red** = Negative news (bearish)
   - ⚪ **Gray** = Neutral news

### View Market News
1. Click the "Market News" tab
2. See general market and financial news
3. Same sentiment color coding applies

### Read Full Article
- Click any news card to open original article in new tab
- See source, publish time, and sentiment label

## What's Happening Behind the Scenes

```
Backend (Flask/FastAPI):
  → Scrapes Yahoo Finance RSS
  → Scrapes MarketWatch RSS
  → Scrapes CNBC RSS
  → Removes duplicates
  → Analyzes sentiment
  → Returns JSON with articles

Frontend (React):
  → Fetches from /api/news/stock/{symbol}
  → Or fetches from /api/news/market
  → Displays with color-coded sentiment
  → User clicks to read full article
```

## News Sources

| Source | Type | Content |
|--------|------|---------|
| **Yahoo Finance** | RSS | Stock-specific news |
| **MarketWatch** | RSS | Market overview & trends |
| **CNBC** | RSS | Breaking financial news |

## Sentiment Analysis

Articles are analyzed for keyword patterns:

**Positive** (🟢 Green):
- Profit, gain, surge, strong, beat, growth, bullish

**Negative** (🔴 Red):
- Loss, fall, crash, warn, weak, decline, bearish

**Neutral** (⚪ Gray):
- Announcement, update, report (without strong sentiment)

## Troubleshooting

### Backend won't start
```bash
# Check if port 8000 is in use
lsof -i :8000

# If needed, use different port
uvicorn server:app --reload --port 8001
```

### No news appears
1. Check backend is running: http://localhost:8000/docs
2. Try manually: http://localhost:8000/api/news/market
3. Check browser console for errors (F12)
4. Verify internet connection (RSS feeds need external access)

### News takes too long to load
- First load may take 5-10 seconds (fetching from multiple sources)
- Subsequent loads are faster
- Each source has a 10-second timeout

## Customization

### Add more news sources
Edit `backend/news_scraper.py`:

```python
NEWS_SOURCES = {
    "reuters": {
        "url": "https://feeds.reuters.com/markets/marketsNews",
        "type": "rss"
    },
    # Add more sources here
}
```

### Change sentiment keywords
In `news_scraper.py`, update `analyze_sentiment()` method:

```python
pos_words = r'\b(your|custom|positive|words)\b'
neg_words = r'\b(your|custom|negative|words)\b'
```

### Adjust number of articles
In `news_scraper.py`:
```python
return articles[:30]  # Change 30 to your desired number
```

## API Endpoints Reference

```bash
# Get news for a specific stock
curl http://localhost:8000/api/news/stock/AAPL

# Get general market news
curl http://localhost:8000/api/news/market

# Get trending news
curl http://localhost:8000/api/news/trending
```

## Files Created/Modified

### New Files
- ✅ `backend/news_scraper.py` - Scraping engine
- ✅ `src/hooks/useNews.js` - React hook
- ✅ `NEWS_FEATURE.md` - Full documentation
- ✅ `NEWS_IMPLEMENTATION.md` - Implementation summary
- ✅ `QUICKSTART_NEWS.md` - This file

- ### Modified Files
- ✅ `backend/server.py` - Added API endpoints
- ✅ `src/pages/NewsPage.jsx` - Updated UI
- ✅ `requirements.txt` - Added dependencies

## Performance Notes

- **Caching**: News is fetched fresh on each request (no caching yet)
- **Timeout**: 10 seconds per source (fast failure)
- **Deduplication**: Same article from multiple sources shown once
- **Limit**: Returns top 20-30 articles to prevent overload

## Next Level Features

Once you're comfortable with the basics:

1. **Real-time Updates**: Add WebSocket for live news
2. **News Search**: Filter by keyword or date
3. **Alerts**: Get notified of relevant news
4. **Sentiment Dashboard**: See overall market sentiment
5. **Trading Integration**: Trigger trades based on news

---

**Questions?** Check `NEWS_FEATURE.md` for detailed documentation or `NEWS_IMPLEMENTATION.md` for technical details.

Happy trading! 📈
