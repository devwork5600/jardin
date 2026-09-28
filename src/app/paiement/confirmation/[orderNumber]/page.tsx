import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { CheckoutStepper } from "@/components/checkout/checkout-stepper";
import { ClearCart } from "@/components/checkout/clear-cart";
import { PaymentPendingRefresh } from "@/components/checkout/payment-pending-refresh";
import { OrderInfo } from "@/components/orders/order-info";
import { OrderRecap } from "@/components/orders/order-recap";
import { auth } from "@/lib/auth";
import { getUserOrder } from "@/lib/order-queries";
import { reconcileOrderPayment } from "@/lib/payments";

export const metadata: Metadata = {
  title: "Commande confirmée — Feuilles et épines",
};

export default async function ConfirmationPage(
  props: PageProps<"/paiement/confirmation/[orderNumber]">,
) {
  const { orderNumber } = await props.params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect(`/connexion?next=/paiement/confirmation/${orderNumber}`);
  }

  // Scoped to the signed-in customer: someone else's order number is a 404.
  let order = await getUserOrder(session.user.id, orderNumber);
  if (!order) notFound();

  // Back from Stripe: ask Stripe what happened rather than trusting the
  // redirect (or waiting for the webhook). Failing to reach Stripe just leaves
  // the order pending, and the page keeps re-checking.
  if (order.status === "EN_ATTENTE_PAIEMENT") {
    try {
      await reconcileOrderPayment(order);
      order = (await getUserOrder(session.user.id, orderNumber)) ?? order;
    } catch (error) {
      console.error("reconcileOrderPayment failed", error);
    }
  }
  const pending = order.status === "EN_ATTENTE_PAIEMENT";
  const canceled = order.status === "ANNULEE";

  return (
    <section className="container-page pt-[clamp(32px,5vw,56px)] pb-[clamp(64px,8vw,112px)]">
      {/* Only once the order is really paid: someone who opens this URL early keeps their cart. */}
      {!pending && !canceled && <ClearCart />}

      <div className="flex flex-wrap items-end justify-between gap-5">
        <h1 className="font-serif text-[clamp(38px,5vw,60px)] leading-[1.02] font-normal tracking-[-0.025em] text-ink">
          {pending ? (
            <>
              Paiement <em>en cours</em>
            </>
          ) : canceled ? (
            <>
              Commande <em>annulée</em>
            </>
          ) : (
            <>
              Commande <em>confirmée</em>
            </>
          )}
        </h1>
        <CheckoutStepper current={3} />
      </div>

      <div className="mt-10 flex flex-wrap items-start gap-8">
        <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-[22px]">
          <div className="rounded-[20px] border border-border-soft bg-surface p-[clamp(22px,3vw,32px)]">
            <span className="eyebrow">Commande n° {order.orderNumber}</span>
            <p className="mt-3 font-serif text-2xl leading-[1.3] text-ink">
              {pending
                ? `Merci ${order.contactName.split(" ")[0]}, nous confirmons votre paiement.`
                : canceled
                  ? "Cette commande a été annulée. Aucun montant n'a été débité."
                  : `Merci ${order.contactName.split(" ")[0]}, votre commande est en préparation.`}
            </p>
            {pending && <PaymentPendingRefresh />}
            <OrderInfo order={order} />
          </div>

          <div>
            <Link
              href="/"
              className="inline-block rounded-[10px] bg-ink px-6 py-[15px] text-sm font-semibold text-ivory"
            >
              Continuer mes achats
            </Link>
          </div>
        </div>

        <OrderRecap order={order} className="min-w-0 flex-[1_1_340px]" />
      </div>
    </section>
  );
}
