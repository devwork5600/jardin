import { z } from "zod";
import { FR_PHONE } from "@/lib/validators/phone";

export const ProfileFormSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis").max(60, "60 caractères maximum"),
  lastName: z.string().trim().min(1, "Nom requis").max(60, "60 caractères maximum"),
  phone: z
    .string()
    .trim()
    .refine((value) => value === "" || FR_PHONE.test(value), "Numéro de téléphone invalide"),
});

export type ProfileFormValues = z.infer<typeof ProfileFormSchema>;
