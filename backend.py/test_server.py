import pytest
from fastapi.testclient import TestClient
from backend.py import server

client = TestClient(server.app)

def test_get_popular_stocks():
    response = client.get("/api/stocks")
    assert response.status_code == 200
    data = response.json()
    assert "stocks" in data
    assert isinstance(data["stocks"], list)
    assert any(stock["symbol"] == "AAPL" for stock in data["stocks"])

def test_get_stock_data_valid():
    response = client.get("/api/stock/NVDA")
    assert response.status_code == 200
    data = response.json()
    assert data["symbol"] == "NVDA"
    assert "candles" in data
    assert "price" in data

def test_get_stock_data_invalid():
    response = client.get("/api/stock/INVALID")
    assert response.status_code in (400, 404)
