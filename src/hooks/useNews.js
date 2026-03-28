import { useEffect, useState, useCallback } from "react";

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
      const response = await fetch(`http://localhost:8000/api/news/stock/${symbol}`);
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
      const response = await fetch("http://localhost:8000/api/news/market");
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
      const response = await fetch("http://localhost:8000/api/news/trending");
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
