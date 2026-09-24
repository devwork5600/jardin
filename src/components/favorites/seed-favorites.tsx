"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

// The favourites page already knows, from the server, exactly which products
// are favourites: put that in the shared cache so its hearts are right (and
// clickable) immediately instead of after a round trip. Seeded before the
// cards mount, in this component's initializer, so nothing re-renders.
export function SeedFavorites({ productIds }: { productIds: string[] }) {
  const queryClient = useQueryClient();
  useState(() => {
    queryClient.setQueryData(["favorites"], { signedIn: true, productIds });
  });
  return null;
}
