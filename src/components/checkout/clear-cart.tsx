"use client";

import { useEffect } from "react";
import { useCartStore } from "@/lib/cart";

// The order exists: empty the cart. Done here rather than before navigating,
// so the checkout page never flashes "empty cart" on its way out.
export function ClearCart() {
  useEffect(() => {
    useCartStore.getState().clear();
  }, []);

  return null;
}
