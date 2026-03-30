from typing import Any, Dict, List, cast
from fastapi.testclient import TestClient
from backend import server

client: TestClient = TestClient(server.app)

def test_get_popular_stocks():
    data = cast(Dict[str, Any], client.get("/api/stocks").json())  # type: ignore
    assert isinstance(data, dict)
    assert "stocks" in data
    assert isinstance(data["stocks"], list)
    stocks: List[Dict[str, Any]] = cast(List[Dict[str, Any]], data.get("stocks", []))
    assert any(stock.get("symbol") == "AAPL" for stock in stocks)

def test_get_stock_data_valid():
    data = cast(Dict[str, Any], client.get("/api/stock/NVDA").json())  # type: ignore
    assert data["symbol"] == "NVDA"
    assert "candles" in data
    assert "price" in data

def test_get_stock_data_invalid():
    assert client.get("/api/stock/INVALID").status_code in (400, 404)  # type: ignore
