import { useEffect, useState, useCallback, useRef } from 'react';
import { ApiService } from '../api/apiService';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface UseApiOptions<TRequest = any> {
  method?: HttpMethod;
  params?: Record<string, any>;
  body?: TRequest;
  autoFetch?: boolean;
}

interface UseApiResponse<TResponse, TRequest> {
  data: TResponse | null;
  loading: boolean;
  error: string | null;
  refetch: (overrideOptions?: Partial<UseApiOptions<TRequest>>) => void;
}

export function useApi<TResponse, TRequest = any>(
  url: string,
  options: UseApiOptions<TRequest> = {}
): UseApiResponse<TResponse, TRequest> {
  const {
    method = 'GET',
    params = undefined,
    body = undefined,
    autoFetch = true,
  } = options;

  const [data, setData] = useState<TResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);

  // Keep the latest options in a ref (so they’re always available)
  const latestOptions = useRef<UseApiOptions<TRequest>>({
    method,
    params,
    body,
  });

  const [shouldFetch, setShouldFetch] = useState(false);

  // ✅ Actual API request function
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { method, params, body } = latestOptions.current;

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

      setData(response);
    } catch (err: any) {
      setError(
        err?.response?.data || err || 'Something went wrong.'
      );
    } finally {
      setLoading(false);
    }
  }, [url]);

  // ✅ Trigger fetch when requested
  useEffect(() => {
    if (autoFetch || shouldFetch) {
      fetchData();
      setShouldFetch(false); // reset flag after sending request
    }
  }, [fetchData, autoFetch, shouldFetch]);

  // ✅ Trigger manually with new body/params
  const refetch = (overrideOptions?: Partial<UseApiOptions<TRequest>>) => {
    latestOptions.current = { ...latestOptions.current, ...overrideOptions };
    setShouldFetch(true); // triggers the useEffect above
  };

  return { data, loading, error, refetch };
}
