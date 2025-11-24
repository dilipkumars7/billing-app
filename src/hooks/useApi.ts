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
  path?: string;
  urlOverride?: string;
}

interface UseApiResponse<TResponse, TRequest> {
  data: TResponse | null;
  loading: boolean;
  error: any | null;
  refetch: (overrideOptions?: RefetchOptions<TRequest>) => Promise<TResponse | null>;
}

export function useApi<TResponse, TRequest = any>(
  baseUrl: string,
  options: UseApiOptions<TRequest> = {}
): UseApiResponse<TResponse, TRequest> {
  const {
    method = "GET",
    params,
    body,
    autoFetch = true,
  } = options;

  const [data, setData] = useState<TResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<any | null>(null);

  // Stores most recent method/params/body without causing rerenders
  const latestOptions = useRef<UseApiOptions<TRequest>>({
    method,
    params,
    body
  });

  // Ensures auto-fetch runs only once even in StrictMode
  const hasInitialized = useRef(false);

  // 🔨 Core API request logic
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
          default:
            response = await ApiService.get<TResponse>(finalUrl, params);
            break;
        }

        setData(response);
        setError(null); // Clear any previous errors
        return response;
      } catch (err: any) {
        const errorData = err?.response?.data || err.message || "Something went wrong.";
        setError(errorData);
        setData(null); // Clear data on error
        return null;
      } finally {
        setLoading(false);
      }
    },
    [baseUrl]
  );

  // Run auto-fetch once
  useEffect(() => {
    if (autoFetch && !hasInitialized.current) {
      hasInitialized.current = true;
      fetchData();
    }
  }, [autoFetch, fetchData]);

  const refetch = useCallback(async (
    overrideOptions?: RefetchOptions<TRequest>
  ): Promise<TResponse | null> => {

    // Update latest options with overrides
    latestOptions.current = {
      ...latestOptions.current,
      ...overrideOptions
    };

    const url =
      overrideOptions?.urlOverride ||
      (overrideOptions?.path ? `${baseUrl}${overrideOptions.path}` : baseUrl);

    return await fetchData(url);
  }, [baseUrl, fetchData]);

  return { data, loading, error, refetch };
}