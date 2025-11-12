import { useEffect, useState, useCallback, useRef } from "react";
import { ApiService } from "../api/apiService";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface UseApiOptions<TRequest = any> {
  method?: HttpMethod;
  params?: Record<string, any>;
  body?: TRequest;
  autoFetch?: boolean;
}

interface RefetchOptions<TRequest = any> extends Partial<UseApiOptions<TRequest>> {
  /** optional path segment to append to base URL */
  path?: string;
  /** optional complete override of the URL */
  urlOverride?: string;
}

interface UseApiResponse<TResponse, TRequest> {
  data: TResponse | null;
  loading: boolean;
  error: string | null;
  refetch: (overrideOptions?: RefetchOptions<TRequest>) => Promise<TResponse | null>;
}

export function useApi<TResponse, TRequest = any>(
  baseUrl: string,
  options: UseApiOptions<TRequest> = {}
): UseApiResponse<TResponse, TRequest> {
  const {
    method = "GET",
    params = undefined,
    body = undefined,
    autoFetch = true,
  } = options;

  const [data, setData] = useState<TResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const latestOptions = useRef<UseApiOptions<TRequest>>({
    method,
    params,
    body,
  });

  const [shouldFetch, setShouldFetch] = useState(false);

  // ✅ Core API request logic
  const fetchData = useCallback(
    async (customUrl?: string): Promise<TResponse | null> => {
      setLoading(true);
      setError(null);

      const { method, params, body } = latestOptions.current;
      const finalUrl = customUrl || baseUrl;

      try {
        let response: TResponse;

        switch (method) {
          case "POST":
            response = await ApiService.post<TResponse>(finalUrl, body);
            break;
          case "PUT":
            response = await ApiService.put<TResponse>(finalUrl, body);
            break;
          case "DELETE":
            response = await ApiService.delete<TResponse>(finalUrl);
            break;
          case "GET":
          default:
            response = await ApiService.get<TResponse>(finalUrl, params);
            break;
        }

        setData(response);
        return response;
      } catch (err: any) {
        setError(
          err?.response?.data || err || 'Something went wrong.'
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [baseUrl]
  );

  // ✅ Auto-fetch if required
  useEffect(() => {
    if (autoFetch || shouldFetch) {
      fetchData();
      setShouldFetch(false);
    }
  }, [fetchData, autoFetch, shouldFetch]);

  // ✅ Manual trigger (supports dynamic paths)
  const refetch = async (
    overrideOptions?: RefetchOptions<TRequest>
  ): Promise<TResponse | null> => {
    latestOptions.current = {
      ...latestOptions.current,
      ...overrideOptions,
    };

    const path = overrideOptions?.path
      ? `${baseUrl}${overrideOptions.path}`
      : overrideOptions?.urlOverride || baseUrl;

    return await fetchData(path);
  };

  return { data, loading, error, refetch };
}
