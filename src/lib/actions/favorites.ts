"use server";

import { z } from "zod";
import { setFavorite } from "@/lib/favorites";
import { getSession } from "@/lib/session";

const InputSchema = z.object({
  productId: z.string().min(1),
  favorited: z.boolean(),
});

export async function setFavoriteAction(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Connectez-vous pour gérer vos favoris." };

  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Requête invalide." };

  return setFavorite(session.user.id, parsed.data.productId, parsed.data.favorited);
}
