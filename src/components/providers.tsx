"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CART_STORAGE_KEY, useCartStore } from "@/lib/cart";

export function Providers({ children }: { children: ReactNode }) {
  // One client per browser session (useState keeps it stable across renders);
  // its cache is what lets "back from a product page" restore every page of
  // an infinite list already loaded.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );

  // The cart is persisted in localStorage but hydrated here, after mount, so
  // the first client render matches the server HTML. The storage event keeps
  // several tabs on the same cart.
  useEffect(() => {
    void useCartStore.persist.rehydrate();
    const onStorage = (event: StorageEvent) => {
      if (event.key === CART_STORAGE_KEY) void useCartStore.persist.rehydrate();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
