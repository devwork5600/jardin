import { prisma } from "@/lib/prisma";
import type { ContactFormValues } from "@/lib/validators/contact-schema";

const MAX_MESSAGES_PER_HOUR = 5;

type ContactInput = Pick<
  ContactFormValues,
  "name" | "email" | "phone" | "topic" | "message"
>;

// Stores the message. The per-address cap works from the database, so it holds
// across serverless instances (an in-memory counter wouldn't).
export async function saveContactMessage(
  input: ContactInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = input.email.toLowerCase();

  const recent = await prisma.contactMessage.count({
    where: { email, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
  });
  if (recent >= MAX_MESSAGES_PER_HOUR) {
    return { ok: false, error: "Trop de messages envoyés, réessayez dans une heure." };
  }

  await prisma.contactMessage.create({
    data: {
      name: input.name,
      email,
      phone: input.phone || null,
      topic: input.topic,
      message: input.message,
    },
  });
  return { ok: true };
}
