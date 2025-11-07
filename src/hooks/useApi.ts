import { useEffect, useState, useCallback } from 'react';
import { ApiService } from '../api/apiService';

// 🔹 Type for supported HTTP methods
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

// 🔹 Hook configuration options
interface UseApiOptions<TRequest = any> {
  method?: HttpMethod;
  params?: Record<string, any>;
  body?: TRequest;
  autoFetch?: boolean; // optional — allows deferring fetch until triggered
}

// 🔹 Hook response type
interface UseApiResponse<TResponse> {
  data: TResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void; // allows manual re-triggering of fetch
}

// ✅ Generic hook that supports all CRUD methods
export function useApi<TResponse, TRequest = any>(
  url: string,
  options: UseApiOptions<TRequest> = {}
): UseApiResponse<TResponse> {
  const {
    method = 'GET',
    params,
    body,
    autoFetch = true,
  } = options;

  const [data, setData] = useState<TResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState<number>(0); // used for refetching

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    let isMounted = true;

    try {
      let response: TResponse;

      switch (method) {
        case 'POST':
          response = await ApiService.post<TResponse>(url, body);
          break;
        case 'PUT':
          response = await ApiService.put<TResponse>(url, body);
          break;
        case 'DELETE':
          response = await ApiService.delete<TResponse>(url);
          break;
        case 'GET':
        default:
          response = await ApiService.get<TResponse>(url, params);
          break;
      }

      if (isMounted) {
        setData(response);
      }
    } catch (err: any) {
      if (isMounted) {
        setError(err.message || 'An unexpected error occurred.');
      }
    } finally {
      if (isMounted) setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [url, method, JSON.stringify(params), JSON.stringify(body), trigger]);

  // Auto fetch when component mounts or dependencies change
  useEffect(() => {
    if (autoFetch) fetchData();
  }, [fetchData, autoFetch]);

  // 🔹 Allows manual re-fetching
  const refetch = () => setTrigger((prev) => prev + 1);

  return { data, loading, error, refetch };
}
