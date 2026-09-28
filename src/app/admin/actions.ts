"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin";
import { AdminOrderError, changeOrderStatus, refundOrder } from "@/lib/order-admin";

type ActionResult =
  | { ok: true; message: string; warning?: string }
  | { ok: false; error: string };

const TargetSchema = z.enum(["PRETE_AU_RETRAIT", "RETIREE", "ANNULEE"]);

const MESSAGES = {
  PRETE_AU_RETRAIT: "Commande marquée prête au retrait.",
  RETIREE: "Commande retirée : la dépense est créditée à la fidélité du client.",
  ANNULEE: "Commande annulée, stock remis en vente.",
} as const;

function fail(error: unknown): ActionResult {
  if (error instanceof AdminOrderError) return { ok: false, error: error.message };
  console.error("admin action failed", error);
  return { ok: false, error: "Une erreur est survenue, réessayez dans un instant." };
}

export async function updateOrderStatus(orderId: string, target: string): Promise<ActionResult> {
  await assertAdmin();
  const parsed = TargetSchema.safeParse(target);
  if (!parsed.success) return { ok: false, error: "Statut inconnu." };

  try {
    const { refundOwed } = await changeOrderStatus(orderId, parsed.data);
    revalidatePath("/admin/commandes");
    return {
      ok: true,
      message: MESSAGES[parsed.data],
      warning: refundOwed
        ? "Le remboursement Stripe a échoué : utilisez « Réessayer le remboursement » sur cette page."
        : undefined,
    };
  } catch (error) {
    return fail(error);
  }
}

export async function retryRefund(orderId: string): Promise<ActionResult> {
  await assertAdmin();
  try {
    const result = await refundOrder(orderId);
    revalidatePath("/admin/commandes");
    return { ok: true, message: result === "REFUNDED" ? "Client remboursé." : "Déjà remboursé." };
  } catch (error) {
    return fail(error);
  }
}
