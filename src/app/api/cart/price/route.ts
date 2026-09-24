import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { priceCart } from "@/lib/cart-pricing";
import { CartItemsSchema } from "@/lib/validators/cart-schema";

const BodySchema = z.object({ items: CartItemsSchema });

// Prices the cart the client holds. The response also says whether the caller
// is signed in, since e-drive prices and loyalty discounts are account-only.
export async function POST(request: Request) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Panier invalide" }, { status: 400 });
  }

  const session = await auth.api.getSession({ headers: request.headers });
  const cart = await priceCart(parsed.data.items, session?.user.id ?? null);

  return NextResponse.json({ ...cart, signedIn: session !== null });
}
