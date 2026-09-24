import type { Metadata } from "next";
import { CartView } from "@/components/checkout/cart-view";
import { CheckoutStepper } from "@/components/checkout/checkout-stepper";

export const metadata: Metadata = {
  title: "Mon panier — Jardin Indoor",
};

export default function PanierPage() {
  return (
    <section className="container-page pt-[clamp(32px,5vw,56px)] pb-[clamp(64px,8vw,112px)]">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <h1 className="font-serif text-[clamp(38px,5vw,60px)] leading-[1.02] font-normal tracking-[-0.025em] text-ink">
          Mon <em>panier</em>
        </h1>
        <CheckoutStepper current={1} />
      </div>

      <CartView />
    </section>
  );
}
