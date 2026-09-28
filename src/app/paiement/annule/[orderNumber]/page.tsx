import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getUserOrder } from "@/lib/order-queries";
import { abandonCardOrder } from "@/lib/payments";

// Where Stripe's "back" link lands. Nothing to show: give the unpaid order up
// (stock back on the shelf, session closed so it can't be paid later) and send
// the customer back to the checkout with their cart intact.
export default async function PaymentCanceledPage(
  props: PageProps<"/paiement/annule/[orderNumber]">,
) {
  const { orderNumber } = await props.params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect(`/connexion?next=/paiement`);

  const order = await getUserOrder(session.user.id, orderNumber);
  if (order?.status === "EN_ATTENTE_PAIEMENT") {
    await abandonCardOrder(order);
  }

  redirect("/paiement?annule=1");
}
