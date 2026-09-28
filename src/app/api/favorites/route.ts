import { NextResponse } from "next/server";
import { getFavoriteIds } from "@/lib/favorites";
import { getSession } from "@/lib/session";

// The signed-in customer's favourite product ids (empty for guests), read once
// by every heart button on the page.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ signedIn: false, productIds: [] });

  return NextResponse.json({
    signedIn: true,
    productIds: await getFavoriteIds(session.user.id),
  });
}
