# News Feature Documentation

## Overview

The News feature provides real-time financial news from multiple sources using **web scraping**. It includes sentiment analysis to help traders understand market sentiment.

## Architecture

### Backend Components

#### 1. **news_scraper.py** - News Scraping Engine
- **Location**: `backend.py/news_scraper.py`
- **Functionality**:
  - Scrapes RSS feeds from multiple financial news sources
  - Parses RSS feeds (Yahoo Finance, MarketWatch, CNBC)
  - Performs sentiment analysis on articles
  - Caches and deduplicates news

**Supported Sources**:
- **Yahoo Finance**: Stock-specific news
- **MarketWatch**: Market overview and trends
- **CNBC**: Breaking financial news

**Key Classes**:
```python
class NewsScraper:
    - fetch_stock_news(symbol) → List[Article]
    - fetch_market_news() → List[Article]
    - analyze_sentiment(title, desc) → "positive"|"negative"|"neutral"
    - parse_rss_feed(xml_content, source) → List[Article]
```

#### 2. **API Endpoints** - FastAPI integration in `server.py`

**Stock News Endpoint**:
```
GET /api/news/stock/{symbol}
Returns: Articles for a specific stock
Response: { "articles": [...], "symbol": "AAPL" }
```

**Market News Endpoint**:
```
GET /api/news/market
Returns: General market news from multiple sources
Response: { "articles": [...] }
```

**Trending News Endpoint**:
```
GET /api/news/trending
Returns: Top trending market news
Response: { "articles": [...], "type": "trending" }
```

### Frontend Components

#### 1. **useNews Hook** - React hook for news fetching
- **Location**: `src/hooks/useNews.js`
- **Functions**:
  - `fetchStockNews(symbol)` - Fetch news for a stock
  - `fetchMarketNews()` - Fetch market-wide news
  - `fetchTrendingNews()` - Fetch trending news

#### 2. **NewsPage Component** - News display interface
- **Location**: `src/pages/NewsPage.jsx`
- **Features**:
  - Tab switching between stock news and market news
  - Real-time sentiment indicators
  - Article metadata (source, timestamp)
  - Link to original articles
  - Responsive loading states

## Article Structure

Each article returned from the API contains:

```javascript
{
  title: string,              // Article headline
  link: string,               // Original article URL
  pubDate: string,            // Publication date (RFC 2822)
  description: string,        // Article summary (max 200 chars)
  source: string,             // Source name (Yahoo Finance, MarketWatch, CNBC)
  sentiment: string,          // "positive" | "negative" | "neutral"
  image?: string              // Optional image URL
}
```

## Sentiment Analysis

The sentiment analyzer looks for keyword patterns in article titles and descriptions:

**Positive Keywords**: surge, soar, jump, gain, rise, rally, beat, record, profit, growth, strong, boost, upgrade, bull, buy, outperform, bullish...

**Negative Keywords**: fall, drop, crash, plunge, sink, loss, miss, warn, cut, downgrade, bear, sell, underperform, bearish...

**Logic**:
- If positive keywords > negative keywords + 1 → "positive"
- If negative keywords > positive keywords + 1 → "negative"
- Otherwise → "neutral"

## Installation & Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Start Backend Server

```bash
cd backend
uvicorn server:app --reload --port 8000
```

### 3. Frontend Auto-fetches News

The frontend will automatically fetch news when:
- Switching to the News page
- Clicking between "Stock News" and "Market News" tabs
- Clicking the Refresh button

## Usage Examples

### Frontend - Fetch Stock News
```javascript
const { fetchStockNews, articles, loading } = useNews();

useEffect(() => {
  fetchStockNews("AAPL");
}, []);

// articles will contain AAPL news with sentiment
```

### Frontend - Fetch Market News
```javascript
const { fetchMarketNews, articles } = useNews();

useEffect(() => {
  fetchMarketNews();
}, []);

// articles will contain general market news
```

## Features

✅ **Multi-source scraping** - Yahoo Finance, MarketWatch, CNBC
✅ **Real-time news** - Fresh articles as they're published  
✅ **Sentiment analysis** - Automatic positive/negative/neutral classification
✅ **Stock-specific filtering** - Get news for specific symbols
✅ **Deduplication** - Same article from multiple sources shown once
✅ **Responsive UI** - Loading states, error handling
✅ **Clickable links** - Open original articles in new tab
✅ **Time-based display** - Shows how long ago article was published

## Error Handling

The system gracefully handles:
- Network timeouts (10-second timeout per source)
- Malformed RSS feeds (try/catch with fallback)
- Missing sources (continues with available sources)
- HTML cleanup in descriptions

## Performance Considerations

- **Caching**: Articles are cached at the API level
- **Deduplication**: Removes duplicate articles across sources
- **Limiting**: Returns max 20-30 articles to prevent overshadowing
- **Timeout**: 10-second timeout per source to ensure responsiveness

## Future Enhancements

- [ ] Add more news sources (Reuters, Bloomberg, AP)
- [ ] Implement caching with TTL
- [ ] Add news filtering by sentiment
- [ ] Add news search functionality
- [ ] Real-time WebSocket updates
- [ ] News alerts for specific keywords
- [ ] Integration with trading actions

## Troubleshooting

### "Could not load news" error
- Check if backend server is running on port 8000
- Verify internet connection
- Check RSS feed URLs are accessible

### Missing sentiment analysis
- Ensure article title and description contain enough text
- Check sentiment keyword lists in `news_scraper.py`

### Empty news results
- Some stocks may have no recent news
- Try different symbols or market news tab
- Wait a moment and refresh

## Adding New News Sources

To add a new source, edit `news_scraper.py`:

```python
NEWS_SOURCES = {
    "new_source": {
        "url": "https://...",
        "type": "rss"  # or "html" for web scraping
    }
}
```

Then update the `fetch_market_news()` method to scrape from the new source.
