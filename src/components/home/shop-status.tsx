"use client";

import { useSyncExternalStore } from "react";
import { isShopOpen } from "@/lib/shop-hours";

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 60_000);
  return () => clearInterval(id);
}

export function ShopStatus() {
  // null on the server and during hydration: the pill keeps its size but
  // stays invisible until the real (Paris-time) status is known, so nothing
  // shifts when it appears.
  const open = useSyncExternalStore<boolean | null>(
    subscribe,
    () => isShopOpen(),
    () => null,
  );

  return (
    <div
      className={`mt-3.5 inline-flex items-center gap-2 rounded-pill px-[13px] py-[7px] text-xs font-semibold ${
        open === null
          ? "invisible"
          : open
            ? "bg-status-open-bg text-status-open-text"
            : "bg-status-closed-bg text-status-closed-text"
      }`}
    >
      <span className="size-[7px] rounded-full bg-current" />
      {open === false ? "Fermé en ce moment" : "Ouvert en ce moment"}
    </div>
  );
}
