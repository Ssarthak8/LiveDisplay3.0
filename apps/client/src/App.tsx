import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { SocketProvider } from '@/providers/SocketProvider';
import { router } from '@/routes/index';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SocketProvider room="viewer">
          <RouterProvider router={router} />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
              },
              success: {
                iconTheme: { primary: '#10b981', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#fff' },
              },
            }}
          />
        </SocketProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
