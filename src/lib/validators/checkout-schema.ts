import { z } from "zod";
import { CartItemsSchema } from "@/lib/validators/cart-schema";

// French landline/mobile, with or without +33 / 0033 and separators.
const FR_PHONE = /^(?:(?:\+|00)33|0)\s?[1-9](?:[\s.-]?\d{2}){4}$/;

export const CheckoutFormSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis"),
  lastName: z.string().trim().min(1, "Nom requis"),
  email: z.email("Adresse e-mail invalide"),
  phone: z.string().trim().regex(FR_PHONE, "Numéro de téléphone invalide"),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choisissez un jour de retrait"),
  paymentMethod: z.enum(["CARD", "ON_PICKUP"]),
});

export type CheckoutFormValues = z.infer<typeof CheckoutFormSchema>;

// What the server action receives: the form plus the cart, re-validated there.
export const PlaceOrderInputSchema = CheckoutFormSchema.extend({
  items: CartItemsSchema,
});
