import { useEffect, useState } from 'react';
import { ApiService } from '../api/apiService';

interface UseApiResponse<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export const useApi = <T>(url: string, params?: any): UseApiResponse<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    ApiService.get<T>(url, params)
      .then((response) => {
        if (isMounted) setData(response);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'An error occurred');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [url, JSON.stringify(params)]);

  return { data, loading, error };
};
