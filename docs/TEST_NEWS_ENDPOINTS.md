# 🧪 Testing News Endpoints

## Quick Test Commands

### Option 1: Using curl (Terminal)

```bash
# Test Stock News Endpoint
curl -s http://localhost:8000/api/news/stock/NVDA | jq '.' | head -50

# Test Market News Endpoint
curl -s http://localhost:8000/api/news/market | jq '.' | head -50

# Without jq (simpler)
curl http://localhost:8000/api/news/stock/NVDA

curl http://localhost:8000/api/news/market
```

### Option 2: Using Python

Create a test script:

```python
# test_news.py
import requests
import json

BASE_URL = "http://localhost:8000"

# Test Stock News
print("🔵 Testing Stock News (NVDA)...")
response = requests.get(f"{BASE_URL}/api/news/stock/NVDA")
stock_news = response.json()
print(f"  Status: {response.status_code}")
print(f"  Articles: {len(stock_news.get('articles', []))}")
if stock_news.get('articles'):
    print(f"  First article: {stock_news['articles'][0]['title'][:60]}...")

print("\n" + "="*60 + "\n")

# Test Market News
print("🔵 Testing Market News...")
response = requests.get(f"{BASE_URL}/api/news/market")
market_news = response.json()
print(f"  Status: {response.status_code}")
print(f"  Articles: {len(market_news.get('articles', []))}")
if market_news.get('articles'):
    print(f"  First article: {market_news['articles'][0]['title'][:60]}...")
```

Run with:
```bash
python test_news.py
```

### Option 3: Check Browser Network Tab

1. Open the News page in the app
2. Press F12 to open DevTools
3. Go to "Network" tab
4. Click on "Stock News" tab and watch for:
   - Request to `/api/news/stock/[SYMBOL]`
   - Response should contain articles
5. Click on "Market News" tab and watch for:
   - Request to `/api/news/market`
   - Response should contain different articles

## What to Look For

### ✅ SUCCESS Indicators

**Stock News should:**
- Show articles relevant to the stock symbol (e.g., "NVIDIA" in title)
- Have multiple articles (5-20+)
- Have different sentiment indicators (🟢 positive, 🔴 negative, ⚪ neutral)
- Update when clicking different stock symbols

**Market News should:**
- Show general market articles (S&P, Fed, interest rates, etc.)
- NOT show NVDA-specific articles when you're on Stock News
- Have different articles than Stock News
- Have multiple sources (Yahoo Finance Markets, MarketWatch, CNBC)

### ❌ FAILURE Indicators

**If Stock News is empty:**
- Check backend logs for: "Found 0 articles from Yahoo Finance for NVDA"
- Yahoo Finance RSS may be broken
- Try different symbols (AAPL, TSLA, MSFT)

**If Market News is empty:**
- Check backend logs for: "Total market articles collected: 0"
- All three sources (Yahoo Finance, MarketWatch, CNBC) may be broken
- Try testing one source at a time

**If both show the same articles:**
- Data separation isn't working properly
- Check that both endpoints are being called independently

## Backend Logging Output

When you run the backend, you should see output like:

```
Fetching stock news from: https://feeds.finance.yahoo.com/rss/2.0/headline?s=NVDA...
Found 15 articles from Yahoo Finance for NVDA

Fetching market news from: https://feeds.finance.yahoo.com/rss/2.0/headline?s=SPY...
Found 10 articles from Yahoo Finance Markets
Fetching from MarketWatch: https://feeds.marketwatch.com/rss/marketpulse
Found 12 articles from MarketWatch
Fetching from CNBC: https://feeds.cnbc.com/rss/cnbc_latest.rss
Found 8 articles from CNBC
Total market articles collected: 30
```

## Troubleshooting

### "Cannot GET /api/news/stock/NVDA"
- Backend server isn't running
- Run: `cd backend.py && python -m uvicorn server:app --reload --port 8000`

### "No articles found for NVDA" in logs
- Yahoo Finance RSS may be down
- Try alternative symbols (AAPL, GOOGL)
- Check network connectivity

### Market News returns empty
- All three sources may be down
- Check which sources are failing in logs
- May need to add more reliable sources

### Frontend shows "No news available"
- Could mean API returned empty list
- Check browser DevTools Network tab
- Check what the API actually returned

### Articles not updating after refresh
- Clear browser cache (Ctrl+Shift+Del or Cmd+Shift+Del)
- Restart backend server
- Check if RSS feeds are being cached

## Expected Response Format

### Stock News Response
```json
{
  "articles": [
    {
      "title": "NVIDIA Stock Soars on Strong Earnings",
      "description": "NVIDIA reported record earnings...",
      "link": "https://...",
      "source": "Yahoo Finance",
      "pubDate": "Mon, 01 Apr 2024 10:30:00 +0000",
      "sentiment": "positive",
      "image": "https://..."
    }
  ],
  "symbol": "NVDA",
  "timestamp": "2024-04-01T10:35:00"
}
```

### Market News Response
```json
{
  "articles": [
    {
      "title": "S&P 500 Reaches New Record High",
      "description": "Market indices gained today...",
      "link": "https://...",
      "source": "MarketWatch",
      "pubDate": "Mon, 01 Apr 2024 10:30:00 +0000",
      "sentiment": "positive",
      "image": "https://..."
    }
  ],
  "timestamp": "2024-04-01T10:35:00"
}
```

## Next Steps

1. **Start Backend**
   ```bash
   cd backend.py
   python -m uvicorn server:app --reload --port 8000
   ```

2. **Watch Terminal** for logging output showing what articles are being fetched

3. **Test in Browser** by navigating to News page

4. **Check Network Tab** (F12) to see API responses

5. **If Issues** Check the troubleshooting section above

Good luck! 🚀
