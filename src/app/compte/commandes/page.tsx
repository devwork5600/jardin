import type { Metadata } from "next";
import { OrdersList } from "@/components/orders/orders-list";
import { getUserOrders } from "@/lib/order-queries";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Mes commandes — Jardin Indoor" };

export default async function CommandesPage() {
  const { user } = await requireSession("/compte/commandes");
  const orders = await getUserOrders(user.id);

  return <OrdersList title="Toutes mes commandes" orders={orders} />;
}
