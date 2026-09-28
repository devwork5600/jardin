"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ProfileFormSchema } from "@/lib/validators/profile-schema";

type UpdateResult = { ok: true } | { ok: false; error: string };

export async function updateProfile(input: unknown): Promise<UpdateResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Votre session a expiré, reconnectez-vous." };

  const parsed = ProfileFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Formulaire invalide, vérifiez vos informations." };
  }
  const { firstName, lastName, phone } = parsed.data;

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: `${firstName} ${lastName}`, phone: phone || null },
    });
  } catch (error) {
    console.error("updateProfile failed", error);
    return { ok: false, error: "Une erreur est survenue, réessayez dans un instant." };
  }

  // The greeting in the account layout reads the name.
  revalidatePath("/compte", "layout");
  return { ok: true };
}
