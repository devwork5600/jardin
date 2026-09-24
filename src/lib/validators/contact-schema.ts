import { z } from "zod";
import { FR_PHONE } from "@/lib/validators/phone";

export const CONTACT_TOPICS = [
  { value: "QUESTION", label: "Question sur un produit" },
  { value: "QUOTE", label: "Demande de devis" },
  { value: "ORDER", label: "Ma commande" },
  { value: "OTHER", label: "Autre" },
] as const;

export const ContactFormSchema = z.object({
  name: z.string().trim().min(2, "Nom requis").max(100, "100 caractères maximum"),
  email: z.email("Adresse e-mail invalide").max(254, "Adresse e-mail trop longue"),
  phone: z
    .string()
    .trim()
    .refine((value) => value === "" || FR_PHONE.test(value), "Numéro de téléphone invalide"),
  topic: z.enum(["QUESTION", "QUOTE", "ORDER", "OTHER"]),
  message: z
    .string()
    .trim()
    .min(10, "Message trop court (10 caractères minimum)")
    .max(2000, "2000 caractères maximum"),
  consent: z.boolean().refine((value) => value === true, "Requis pour envoyer votre message"),
  // Honeypot: hidden from people, filled in by form-stuffing bots.
  website: z.string(),
});

export type ContactFormValues = z.infer<typeof ContactFormSchema>;

// ?sujet=devis on /contact preselects the topic (used by the home page CTA).
export const TOPIC_BY_QUERY: Record<string, ContactFormValues["topic"]> = {
  devis: "QUOTE",
  commande: "ORDER",
  produit: "QUESTION",
};
