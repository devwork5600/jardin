import type { Metadata } from "next";
import { ProfileForm } from "@/components/account/profile-form";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Mes informations — Jardin Indoor" };

export default async function InformationsPage() {
  const { user } = await requireSession("/compte/informations");
  const account = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { name: true, email: true, phone: true },
  });

  // The account stores one "name": first word = first name, the rest = last name.
  const [firstName = "", ...lastName] = account.name.trim().split(/\s+/);

  return (
    <ProfileForm
      email={account.email}
      defaultValues={{
        firstName,
        lastName: lastName.join(" "),
        phone: account.phone ?? "",
      }}
    />
  );
}
