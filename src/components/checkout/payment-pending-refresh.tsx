"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const EVERY_MS = 3000;
const MAX_TRIES = 12; // about 36 s, then we stop and say so

// The customer is back from Stripe but the payment isn't confirmed yet (bank
// still answering, or the webhook a few seconds late). Re-run the page's
// server check on a timer instead of leaving them on a dead screen.
export function PaymentPendingRefresh() {
  const router = useRouter();
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (tries >= MAX_TRIES) return;
    const timer = setTimeout(() => {
      router.refresh();
      setTries((n) => n + 1);
    }, EVERY_MS);
    return () => clearTimeout(timer);
  }, [tries, router]);

  return (
    <p role="status" className="mt-4 text-[14px] leading-[1.6] text-text-secondary">
      {tries < MAX_TRIES
        ? "Cette page se met à jour toute seule dès que le paiement est confirmé."
        : "La confirmation prend plus de temps que prévu. Rechargez la page dans un instant ; si rien ne change, contactez la boutique avec votre numéro de commande."}
    </p>
  );
}
