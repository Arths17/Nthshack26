"""
News scraper module — Fetches financial news from multiple sources
Supports: Yahoo Finance RSS, Reddit, MarketWatch, Seeking Alpha
"""

import re
import urllib.request
from urllib.error import URLError, HTTPError
from datetime import datetime
from dataclasses import dataclass
from typing import List, Dict, Optional, Any, Union, Set
import xml.etree.ElementTree as ET

# News sources configuration
NEWS_SOURCES = {
    "yahoo": {
        "url": "https://feeds.finance.yahoo.com/rss/2.0/headline?s={symbol}&region=US&lang=en-US",
        "type": "rss"
    },
    "marketwatch": {
        "url": "https://feeds.marketwatch.com/rss/marketpulse",
        "type": "rss"
    },
    "cnbc": {
        "url": "https://feeds.cnbc.com/id/100003114/",
        "type": "rss"
    }
}

@dataclass
class HTTPResponse:
    status_code: Optional[int]
    content: bytes


class NewsScraper:
    """Scrapes financial news from multiple sources"""
    def __init__(self) -> None:
        self.headers: Dict[str, str] = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        self.timeout: int = 10

    def _http_get(
        self,
        url: str,
        headers: Optional[Dict[str, str]] = None,
        timeout: Optional[int] = None,
    ) -> HTTPResponse:
        req = urllib.request.Request(url, headers=(headers or {}), method='GET')
        try:
            with urllib.request.urlopen(req, timeout=(timeout or self.timeout)) as resp:
                content = resp.read()
                status_code: Optional[int] = None
                try:
                    getcode = getattr(resp, 'getcode', None)
                    tmp_status = None
                    try:
                        if callable(getcode):
                            tmp_status = getcode()
                        else:
                            tmp_status = getattr(resp, 'status', None)
                    except Exception:
                        tmp_status = None
                    if isinstance(tmp_status, int):
                        status_code = tmp_status
                    else:
                        status_code = None
                except Exception:
                    status_code = None
                return HTTPResponse(status_code=status_code, content=content)
        except HTTPError as e:
            body: bytes = b''
            try:
                if hasattr(e, 'read'):
                    body = e.read()
                    if isinstance(body, str):
                        body = body.encode()
            except Exception:
                body = b''
            return HTTPResponse(status_code=getattr(e, 'code', None), content=body)
        except URLError:
            return HTTPResponse(status_code=None, content=b'')

    def parse_rss_feed(self, xml_content: Union[str, bytes], source: str) -> List[Dict[str, Any]]:
        try:
            if isinstance(xml_content, (bytes, bytearray)):
                xml_content = xml_content.decode('utf-8', errors='replace')
            root = ET.fromstring(xml_content)
            articles: List[Dict[str, Any]] = []
            ns: Dict[str, str] = {
                'content': 'http://purl.org/rss/1.0/modules/content/',
                'media': 'http://search.yahoo.com/mrss/',
            }
            for item in root.findall('.//item'):
                title = item.findtext('title', '').strip()
                link = item.findtext('link', '').strip()
                pubDate = item.findtext('pubDate', '').strip()
                description = item.findtext('description', '').strip()
                description = re.sub(r'<[^>]+>', '', description).strip()
                if title and link:
                    articles.append({
                        'title': title,
                        'link': link,
                        'pubDate': pubDate,
                        'description': description[:200],
                        'source': source,
                        'image': self._extract_image(item, ns),
                    })
            return articles[:20]
        except Exception as e:
            print(f"Error parsing RSS feed from {source}: {str(e)}")
            return []

    def _extract_image(self, item: ET.Element, ns: Optional[Dict[str, str]] = None) -> Optional[str]:
        try:
            media = item.find('media:content', ns)
            if media is not None:
                return media.get('url')
            thumb = item.find('media:thumbnail', ns)
            if thumb is not None:
                return thumb.get('url')
            enclosure = item.find('enclosure')
            if enclosure is not None and enclosure.get('type', '').startswith('image'):
                return enclosure.get('url')
        except:
            pass
        return None

    def fetch_stock_news(self, symbol: str) -> List[Dict[str, Any]]:
        all_articles: List[Dict[str, Any]] = []
        try:
            url = NEWS_SOURCES["yahoo"]["url"].format(symbol=symbol)
            print(f"Fetching stock news from: {url}")
            response = self._http_get(url, headers=self.headers, timeout=self.timeout)
            if response.status_code == 200:
                articles = self.parse_rss_feed(response.content, "Yahoo Finance")
                all_articles.extend(articles)
                print(f"Found {len(articles)} articles from Yahoo Finance for {symbol}")
            else:
                print(f"Yahoo Finance returned status {response.status_code}")
        except Exception as e:
            print(f"Error fetching Yahoo Finance news for {symbol}: {str(e)}")
        stock_articles: List[Dict[str, Any]] = []
        for article in all_articles:
            title_lower = article['title'].lower()
            desc_lower = article.get('description', '').lower()
            symbol_lower = symbol.lower()
            if symbol_lower in title_lower or symbol_lower in desc_lower:
                stock_articles.append(article)
                print(f"✓ Keeping article: {article['title'][:70]}...")
            else:
                print(f"✗ Filtering out non-relevant: {article['title'][:70]}...")
        if not stock_articles:
            print(f"No {symbol}-specific articles found after filtering")
            return []
        print(f"Filtered to {len(stock_articles)} {symbol}-specific articles")
        seen: Set[str] = set()
        unique_articles: List[Dict[str, Any]] = []
        for article in stock_articles:
            if article['title'] not in seen:
                seen.add(article['title'])
                unique_articles.append(article)
        try:
            unique_articles.sort(
                key=lambda x: datetime.strptime(x['pubDate'], '%a, %d %b %Y %H:%M:%S %z'),
                reverse=True
            )
        except:
            pass
        return unique_articles

    def fetch_market_news(self) -> List[Dict[str, Any]]:
        all_articles: List[Dict[str, Any]] = []
        try:
            url = NEWS_SOURCES["yahoo"]["url"].format(symbol="SPY")
            print(f"Fetching market news from: {url}")
            response = self._http_get(url, headers=self.headers, timeout=self.timeout)
            if response.status_code == 200:
                articles = self.parse_rss_feed(response.content, "Yahoo Finance Markets")
                all_articles.extend(articles)
                print(f"Found {len(articles)} articles from Yahoo Finance Markets")
            else:
                print(f"Yahoo Finance returned status {response.status_code}")
        except Exception as e:
            print(f"Error fetching Yahoo Finance market news: {str(e)}")
        try:
            url = NEWS_SOURCES["marketwatch"]["url"]
            print(f"Fetching from MarketWatch: {url}")
            response = self._http_get(url, headers=self.headers, timeout=self.timeout)
            if response.status_code == 200:
                articles = self.parse_rss_feed(response.content, "MarketWatch")
                all_articles.extend(articles)
                print(f"Found {len(articles)} articles from MarketWatch")
            else:
                print(f"MarketWatch returned status {response.status_code}")
        except Exception as e:
            print(f"Error fetching MarketWatch news: {str(e)}")
        try:
            url = NEWS_SOURCES["cnbc"]["url"]
            print(f"Fetching from CNBC: {url}")
            response = self._http_get(url, headers=self.headers, timeout=self.timeout)
            if response.status_code == 200:
                articles = self.parse_rss_feed(response.content, "CNBC")
                all_articles.extend(articles)
                print(f"Found {len(articles)} articles from CNBC")
            else:
                print(f"CNBC returned status {response.status_code}")
        except Exception as e:
            print(f"Error fetching CNBC news: {str(e)}")
        print(f"Total market articles collected: {len(all_articles)}")
        seen: Set[str] = set()
        unique_articles: List[Dict[str, Any]] = []
        for article in all_articles:
            if article['title'] not in seen:
                seen.add(article['title'])
                unique_articles.append(article)
        try:
            unique_articles.sort(
                key=lambda x: datetime.strptime(x['pubDate'], '%a, %d %b %Y %H:%M:%S %z'),
                reverse=True
            )
        except:
            pass
        return unique_articles[:30]

    def analyze_sentiment(self, title: str, description: str) -> str:
        pos_words = r'\b(surge|soar|jump|gain|rise|rally|beat|record|profit|growth|strong|boost|upgrade|bull|buy|outperform|high|up|positive|win|exceed|top|bullish)\b'
        neg_words = r'\b(fall|drop|crash|plunge|sink|loss|miss|warn|cut|downgrade|bear|sell|underperform|low|down|negative|risk|concern|fear|weak|decline|layoff|lawsuit|fine|penalty|bearish)\b'
        text = f"{title} {description}".lower()
        pos_count = len(re.findall(pos_words, text, re.IGNORECASE))
        neg_count = len(re.findall(neg_words, text, re.IGNORECASE))
        if pos_count > neg_count + 1:
            return "positive"
        elif neg_count > pos_count + 1:
            return "negative"
        else:
            return "neutral"

# Global scraper instance
scraper = NewsScraper()
