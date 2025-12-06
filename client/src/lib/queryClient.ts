import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Use relative URLs - server and client are on the same origin
  // Ignore VITE_API_URL if it points to localhost:3000 (wrong port) or in production
  const envApiUrl = import.meta.env.VITE_API_URL;
  const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';
  const isWrongPort = envApiUrl?.includes('localhost:3000');
  
  // Only use BASE_URL if:
  // 1. Not in production AND
  // 2. Not pointing to wrong port (3000) AND
  // 3. Actually set
  const BASE_URL = (!isProduction && !isWrongPort && envApiUrl) ? envApiUrl : '';
  const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
  const fullUrl = BASE_URL ? `${BASE_URL}${normalizedUrl}` : normalizedUrl;
  
  try {
    const res = await fetch(fullUrl, {
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      mode: "cors"
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error('API Request failed:', {
      url: fullUrl,
      method,
      error: error instanceof Error ? error.message : String(error),
      baseUrl: BASE_URL || '(relative)',
      normalizedUrl,
      currentOrigin: window.location.origin
    });
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
