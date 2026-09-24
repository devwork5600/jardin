import { z } from "zod";

export const MAX_LINE_QUANTITY = 99;
export const MAX_CART_LINES = 50;

export const CartItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY),
});

export const CartItemsSchema = z.array(CartItemSchema).max(MAX_CART_LINES);

export type CartItem = z.infer<typeof CartItemSchema>;
