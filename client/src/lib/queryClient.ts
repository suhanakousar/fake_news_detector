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
  // Force relative URLs - server and client are on the same port
  // Ignore VITE_API_URL if it's set to the wrong port
  const envApiUrl = import.meta.env.VITE_API_URL;
  const BASE_URL = (envApiUrl && !envApiUrl.includes('3000')) ? envApiUrl : '';
  const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
  const fullUrl = BASE_URL ? `${BASE_URL}${normalizedUrl}` : normalizedUrl;
  
  // Debug log to help identify issues
  if (fullUrl.includes('3000')) {
    console.warn('⚠️ API request going to port 3000! This should not happen. Full URL:', fullUrl);
  }
  
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
