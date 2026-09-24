"use server";

import { saveContactMessage } from "@/lib/contact-messages";
import { ContactFormSchema } from "@/lib/validators/contact-schema";

type SendResult = { ok: true } | { ok: false; error: string };

export async function sendContactMessage(input: unknown): Promise<SendResult> {
  const parsed = ContactFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Formulaire invalide, vérifiez vos informations." };
  }
  const { name, email, phone, topic, message, website } = parsed.data;

  // A person never sees the honeypot field: whoever filled it is a bot. Say
  // it worked and store nothing, so it learns nothing.
  if (website !== "") return { ok: true };

  try {
    return await saveContactMessage({ name, email, phone, topic, message });
  } catch (error) {
    console.error("sendContactMessage failed", error);
    return { ok: false, error: "Une erreur est survenue, réessayez dans un instant." };
  }
}
