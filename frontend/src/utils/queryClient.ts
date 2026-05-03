import { QueryClient, QueryClientProvider } from 'react-query';
import { createElement, type ComponentType } from 'react';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export function withQueryClient(Component: ComponentType) {
  return function WithQueryClientComponent() {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(Component)
    );
  };
}
