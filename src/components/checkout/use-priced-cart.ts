import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useCartStore } from "@/lib/cart";
import type { PricedCartResponse } from "@/lib/cart-pricing";

// The cart lives in the browser as ids + quantities; this asks the server what
// it actually costs. Changing a quantity re-prices, keeping the previous
// numbers on screen meanwhile so the summary never blanks out.
export function usePricedCart() {
  const items = useCartStore((state) => state.items);

  return useQuery({
    queryKey: ["cart-price", items],
    queryFn: async (): Promise<PricedCartResponse> => {
      const response = await fetch("/api/cart/price", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!response.ok) throw new Error(`Calcul du panier impossible (${response.status})`);
      return response.json();
    },
    enabled: items.length > 0,
    placeholderData: keepPreviousData,
  });
}
