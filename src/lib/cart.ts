import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  CartItemsSchema,
  MAX_LINE_QUANTITY,
  type CartItem,
} from "@/lib/validators/cart-schema";

// The cart only stores what the customer chose (variant + quantity), never
// prices or names: those are re-read from the database when the cart is
// priced, so a tampered localStorage can't change what someone pays.

export const CART_STORAGE_KEY = "jardin-cart-store";

type CartState = {
  items: CartItem[];
  addItem: (variantId: string, quantity: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (variantId, quantity) =>
        set((state) => {
          const existing = state.items.find((i) => i.variantId === variantId);
          return {
            items: existing
              ? state.items.map((i) =>
                  i.variantId === variantId
                    ? {
                        ...i,
                        quantity: Math.min(i.quantity + quantity, MAX_LINE_QUANTITY),
                      }
                    : i,
                )
              : [
                  ...state.items,
                  { variantId, quantity: Math.min(quantity, MAX_LINE_QUANTITY) },
                ],
          };
        }),
      setQuantity: (variantId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.variantId !== variantId)
              : state.items.map((i) =>
                  i.variantId === variantId
                    ? { ...i, quantity: Math.min(quantity, MAX_LINE_QUANTITY) }
                    : i,
                ),
        })),
      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: CART_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      // Rehydrated by <Providers> after mount, not at creation: reading
      // localStorage during the first render would not match the server HTML.
      skipHydration: true,
      // Whatever comes back from localStorage is untrusted input.
      merge: (persisted, current) => {
        const parsed = CartItemsSchema.safeParse(
          (persisted as Partial<CartState> | undefined)?.items,
        );
        return { ...current, items: parsed.success ? parsed.data : [] };
      },
    },
  ),
);

export const selectCartCount = (state: CartState) =>
  state.items.reduce((total, item) => total + item.quantity, 0);
