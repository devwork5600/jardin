"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { retryRefund, updateOrderStatus } from "@/app/admin/actions";

type Target = "PRETE_AU_RETRAIT" | "RETIREE" | "ANNULEE";

const LABELS: Record<Target, string> = {
  PRETE_AU_RETRAIT: "Marquer prête au retrait",
  RETIREE: "Marquer retirée",
  ANNULEE: "Annuler la commande",
};

const BUTTON =
  "h-11 cursor-pointer rounded-[10px] px-[18px] text-[13px] font-semibold disabled:cursor-default disabled:opacity-50";

export function OrderActions({
  orderId,
  allowed,
  refundAmount,
  refundOwed,
}: {
  orderId: string;
  // What the server says can happen next: never decided by this component.
  allowed: Target[];
  // Set when cancelling a card-paid order refunds the customer (formatted).
  refundAmount: string | null;
  // Cancelled and paid by card, money not sent back yet.
  refundOwed: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error" | "warn"; text: string } | null>(null);

  const run = (action: () => ReturnType<typeof updateOrderStatus>) =>
    startTransition(async () => {
      const result = await action();
      setConfirming(false);
      if (!result.ok) return setFeedback({ tone: "error", text: result.error });
      setFeedback(
        result.warning
          ? { tone: "warn", text: `${result.message} ${result.warning}` }
          : { tone: "ok", text: result.message },
      );
      router.refresh();
    });

  const forward = allowed.filter((t) => t !== "ANNULEE");
  const canCancel = allowed.includes("ANNULEE");

  return (
    <div>
      {allowed.length === 0 && !refundOwed && (
        <p className="text-[14px] text-text-tertiary">Cette commande est terminée : plus aucune action possible.</p>
      )}

      <div className="flex flex-wrap items-center gap-2.5">
        {forward.map((target) => (
          <button
            key={target}
            type="button"
            disabled={pending}
            onClick={() => run(() => updateOrderStatus(orderId, target))}
            className={`${BUTTON} bg-ink text-ivory`}
          >
            {LABELS[target]}
          </button>
        ))}

        {canCancel && !confirming && (
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirming(true)}
            className={`${BUTTON} border border-copper text-copper`}
          >
            {LABELS.ANNULEE}
          </button>
        )}

        {refundOwed && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => retryRefund(orderId))}
            className={`${BUTTON} bg-copper text-white`}
          >
            Réessayer le remboursement
          </button>
        )}
      </div>

      {confirming && (
        <div className="mt-4 rounded-[12px] border border-copper/40 bg-[#f3e6dc] p-4 text-[14px] leading-[1.6] text-ink">
          <p>
            Annuler cette commande ? Le stock sera remis en vente
            {refundAmount ? <> et le client sera <strong>remboursé de {refundAmount}</strong> par Stripe</> : null}.
            Cette action est définitive.
          </p>
          <div className="mt-3 flex gap-2.5">
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => updateOrderStatus(orderId, "ANNULEE"))}
              className={`${BUTTON} bg-copper text-white`}
            >
              {pending ? "Annulation…" : "Oui, annuler"}
            </button>
            <button type="button" disabled={pending} onClick={() => setConfirming(false)} className={`${BUTTON} border border-border text-ink`}>
              Non, garder
            </button>
          </div>
        </div>
      )}

      {feedback && (
        <p
          role={feedback.tone === "ok" ? "status" : "alert"}
          className={`mt-4 text-[14px] leading-[1.5] ${feedback.tone === "ok" ? "text-status-open-text" : "text-copper"}`}
        >
          {feedback.text}
        </p>
      )}
    </div>
  );
}
