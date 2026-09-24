import type { Metadata } from "next";
import { headers } from "next/headers";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { CheckoutStepper } from "@/components/checkout/checkout-stepper";
import { auth } from "@/lib/auth";
import { getPickupDays } from "@/lib/shop-hours";

export const metadata: Metadata = {
  title: "Finaliser ma commande — Jardin Indoor",
};

export default async function PaiementPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  const pickupDays = getPickupDays();
  const [firstName = "", ...lastName] = (user?.name ?? "").split(" ");

  return (
    <section className="container-page pt-[clamp(32px,5vw,56px)] pb-[clamp(64px,8vw,112px)]">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <h1 className="font-serif text-[clamp(38px,5vw,60px)] leading-[1.02] font-normal tracking-[-0.025em] text-ink">
          Finaliser <em>ma commande</em>
        </h1>
        <CheckoutStepper current={2} />
      </div>

      <CheckoutForm
        signedIn={user !== undefined}
        pickupDays={pickupDays}
        defaultValues={{
          firstName,
          lastName: lastName.join(" "),
          email: user?.email ?? "",
          phone: "",
          pickupDate: pickupDays[0]?.iso ?? "",
          paymentMethod: "ON_PICKUP",
        }}
      />
    </section>
  );
}
