import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Deduplicated per request: the account layout and its page both need it.
export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

// For pages that need a signed-in customer. The middleware only checks that a
// session cookie exists; this is the real check (expired or revoked sessions).
export async function requireSession(next: string) {
  const session = await getSession();
  if (!session) redirect(`/connexion?next=${encodeURIComponent(next)}`);
  return session;
}
