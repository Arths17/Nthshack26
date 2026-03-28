import { useEffect, useState } from 'react';
import { API } from '../utils/constants';

/**
 * Hook to fetch and cache popular stocks from backend
 */
export function useStocks() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API.BACKEND_URL}/api/stocks`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch stocks: ${response.status}`);
        }
        
        const data = await response.json();
        setStocks(data.stocks || []);
        setError(null);
      } catch (err) {
        console.error('[STOCKS]', err);
        setError(err.message);
        setStocks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
  }, []);

  return { stocks, loading, error };
}
