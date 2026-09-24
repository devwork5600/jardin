import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { CheckoutStepper } from "@/components/checkout/checkout-stepper";
import { ClearCart } from "@/components/checkout/clear-cart";
import { auth } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Commande confirmée — Jardin Indoor",
};

const pickupDateFormat = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "UTC", // pickupDate is stored as the calendar date at 00:00 UTC
  weekday: "long",
  day: "numeric",
  month: "long",
});

export default async function ConfirmationPage(
  props: PageProps<"/paiement/confirmation/[orderNumber]">,
) {
  const { orderNumber } = await props.params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect(`/connexion?next=/paiement/confirmation/${orderNumber}`);
  }

  // Scoped to the signed-in customer: someone else's order number is a 404.
  const order = await prisma.order.findFirst({
    where: { orderNumber, userId: session.user.id },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                select: { name: true, _count: { select: { variants: true } } },
              },
            },
          },
        },
      },
    },
  });
  if (!order) notFound();

  // "samedi 26 septembre" -> "Samedi 26 septembre" (French months stay lowercase).
  const pickupDay = pickupDateFormat
    .format(order.pickupDate)
    .replace(/^./, (c) => c.toUpperCase());

  return (
    <section className="container-page pt-[clamp(32px,5vw,56px)] pb-[clamp(64px,8vw,112px)]">
      <ClearCart />

      <div className="flex flex-wrap items-end justify-between gap-5">
        <h1 className="font-serif text-[clamp(38px,5vw,60px)] leading-[1.02] font-normal tracking-[-0.025em] text-ink">
          Commande <em>confirmée</em>
        </h1>
        <CheckoutStepper current={3} />
      </div>

      <div className="mt-10 flex flex-wrap items-start gap-8">
        <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-[22px]">
          <div className="rounded-[20px] border border-border-soft bg-surface p-[clamp(22px,3vw,32px)]">
            <span className="eyebrow">Commande n° {order.orderNumber}</span>
            <p className="mt-3 font-serif text-2xl leading-[1.3] text-ink">
              Merci {order.contactName.split(" ")[0]}, votre commande est en
              préparation.
            </p>
            <dl className="mt-6 flex flex-col gap-4 text-[14.5px]">
              <div>
                <dt className="text-xs font-semibold text-text-tertiary">
                  Retrait en boutique
                </dt>
                <dd className="mt-1 text-ink">
                  {pickupDay}, {order.pickupSlot}
                  <br />
                  <span className="text-text-secondary">
                    36 av. Gontran Bienvenu, 56000 Vannes · 02 97 49 95 09
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-text-tertiary">
                  Paiement
                </dt>
                <dd className="mt-1 text-ink">
                  {order.paymentMethod === "ON_PICKUP"
                    ? "Au retrait, par CB ou en espèces"
                    : "Carte bancaire en ligne"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-text-tertiary">
                  Coordonnées
                </dt>
                <dd className="mt-1 text-ink">
                  {order.contactName}
                  <br />
                  {order.contactEmail} · {order.contactPhone}
                </dd>
              </div>
            </dl>
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

        <aside className="min-w-0 flex-[1_1_340px] rounded-[20px] bg-green-deep p-[clamp(22px,3vw,32px)] text-ivory">
          <h2 className="font-serif text-[22px] font-medium">Récapitulatif</h2>
          <ul className="mt-5 flex flex-col gap-4">
            {order.items.map((item) => {
              const product = item.variant.product;
              return (
                <li
                  key={item.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-3.5"
                >
                  <div className="min-w-0">
                    <div className="font-serif text-[14.5px] leading-[1.3]">
                      {product.name}
                      {product._count.variants > 1 && (
                        <span className="text-on-dark-secondary">
                          {" "}
                          — {item.variant.label}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-on-dark-secondary">
                      Qté {item.quantity}
                    </div>
                  </div>
                  <span className="text-sm font-semibold">
                    {formatPrice(item.unitPriceCents * item.quantity)}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-[22px] flex flex-col gap-2.5 border-t border-ivory/15 pt-[18px] text-sm">
            <div className="flex justify-between text-on-dark-secondary">
              <span>Sous-total</span>
              <span>{formatPrice(order.subtotalCents)}</span>
            </div>
            {order.loyaltyDiscountCents > 0 && (
              <div className="flex justify-between text-lime">
                <span>Remise fidélité</span>
                <span>− {formatPrice(order.loyaltyDiscountCents)}</span>
              </div>
            )}
            <div className="flex justify-between text-on-dark-secondary">
              <span>Retrait en boutique</span>
              <span>Gratuit</span>
            </div>
          </div>

          <div className="mt-[18px] flex items-baseline justify-between border-t border-ivory/15 pt-[18px]">
            <span className="text-sm">Total TTC</span>
            <span className="font-serif text-[30px]">
              {formatPrice(order.totalCents)}
            </span>
          </div>
        </aside>
      </div>
    </section>
  );
}
