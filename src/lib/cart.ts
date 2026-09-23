import { useSyncExternalStore } from "react";

// The cart only stores what the customer chose (variant + quantity), never
// prices or names: those are re-read from the database at checkout, so a
// tampered localStorage can't change what a customer pays.
export type CartItem = { variantId: string; quantity: number };

const STORAGE_KEY = "jardin-cart";
const EMPTY: CartItem[] = [];
const listeners = new Set<() => void>();

// useSyncExternalStore needs a referentially stable snapshot: re-parse only
// when the raw string actually changed.
let cache: { raw: string | null; items: CartItem[] } = { raw: null, items: EMPTY };

function isCartItem(value: unknown): value is CartItem {
  const item = value as CartItem;
  return (
    typeof item?.variantId === "string" &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0
  );
}

function readRaw() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getSnapshot(): CartItem[] {
  const raw = readRaw();
  if (raw !== cache.raw) {
    let items = EMPTY;
    try {
      const parsed: unknown = raw ? JSON.parse(raw) : EMPTY;
      if (Array.isArray(parsed)) items = parsed.filter(isCartItem);
    } catch {
      items = EMPTY;
    }
    cache = { raw, items };
  }
  return cache.items;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function addToCart(variantId: string, quantity: number) {
  const items = getSnapshot();
  const existing = items.find((item) => item.variantId === variantId);
  const next = existing
    ? items.map((item) =>
        item.variantId === variantId
          ? { ...item, quantity: item.quantity + quantity }
          : item,
      )
    : [...items, { variantId, quantity }];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage blocked (private mode, quota): the cart just won't persist.
  }
  listeners.forEach((listener) => listener());
}

export function useCart() {
  const items = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
  const count = items.reduce((total, item) => total + item.quantity, 0);
  return { items, count };
}
