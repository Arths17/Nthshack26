import { useEffect, useState, useCallback } from "react";
import { getApiBase } from "../utils/apiBase";
import { API_ROUTE_PREFIX } from "../utils/constants";

/**
 * Hook for fetching news from backend
 */
export function useNews() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStockNews = useCallback(async (symbol) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${getApiBase()}${API_ROUTE_PREFIX}/news/stock/${symbol}`);
      if (!response.ok) throw new Error(`Failed to fetch news: ${response.status}`);
      const data = await response.json();
      setArticles(data.articles || []);
    } catch (err) {
      console.error("Error fetching stock news:", err);
      setError(err.message);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMarketNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${getApiBase()}${API_ROUTE_PREFIX}/news/market`);
      if (!response.ok) throw new Error(`Failed to fetch news: ${response.status}`);
      const data = await response.json();
      setArticles(data.articles || []);
    } catch (err) {
      console.error("Error fetching market news:", err);
      setError(err.message);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrendingNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${getApiBase()}${API_ROUTE_PREFIX}/news/trending`);
      if (!response.ok) throw new Error(`Failed to fetch news: ${response.status}`);
      const data = await response.json();
      setArticles(data.articles || []);
    } catch (err) {
      console.error("Error fetching trending news:", err);
      setError(err.message);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    articles,
    loading,
    error,
    fetchStockNews,
    fetchMarketNews,
    fetchTrendingNews,
  };
}
