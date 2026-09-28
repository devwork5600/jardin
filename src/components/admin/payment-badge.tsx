type Props = {
  paymentMethod: "CARD" | "ON_PICKUP";
  paidAt: Date | null;
  refundedAt: Date | null;
  status: string;
};

// One label for "how did / will this order get paid", including the case that
// needs an action: cancelled after a card payment, refund not done yet.
export function paymentLabel({ paymentMethod, paidAt, refundedAt, status }: Props) {
  if (paymentMethod === "ON_PICKUP") return { text: "Au retrait", urgent: false };
  if (!paidAt) return { text: "Carte · en attente", urgent: false };
  if (status === "ANNULEE") {
    return refundedAt
      ? { text: "Carte · remboursée", urgent: false }
      : { text: "Carte · à rembourser", urgent: true };
  }
  return { text: "Carte · payée", urgent: false };
}

export function PaymentBadge(props: Props) {
  const { text, urgent } = paymentLabel(props);
  return (
    <span
      className={`inline-block rounded-pill px-2.5 py-[5px] text-[11.5px] font-semibold ${
        urgent ? "bg-copper text-white" : "bg-ivory-alt text-text-secondary"
      }`}
    >
      {text}
    </span>
  );
}
