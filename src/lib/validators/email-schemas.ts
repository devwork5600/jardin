import { z } from "zod";

export const MagicLinkSignInSchema = z.object({
  email: z.email("Adresse e-mail invalide"),
});

export type MagicLinkSignInSchemaType = z.infer<typeof MagicLinkSignInSchema>;

export const ConnexionFormSchema = MagicLinkSignInSchema.extend({
  ageCertified: z.boolean().refine((value) => value === true, {
    message: "Case obligatoire pour continuer.",
  }),
});

export type ConnexionFormSchemaType = z.infer<typeof ConnexionFormSchema>;
