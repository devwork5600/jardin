import { notFound } from "next/navigation";
import { getSession, requireSession } from "@/lib/session";

const isAdmin = (user: { role?: string | null }) => user.role === "ADMIN";

// For admin pages. A customer gets a 404, not a "forbidden": the back office
// shouldn't advertise that it exists.
export async function requireAdmin(next: string) {
  const session = await requireSession(next);
  if (!isAdmin(session.user)) notFound();
  return session.user;
}

// For server actions, which can be called by anyone who knows their name: the
// role is checked again there, never trusted from the page that showed the button.
export async function assertAdmin() {
  const session = await getSession();
  if (!session || !isAdmin(session.user)) throw new Error("Accès refusé");
  return session.user;
}

export const userIsAdmin = isAdmin;
