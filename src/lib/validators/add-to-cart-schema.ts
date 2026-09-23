import { z } from "zod";

// Built per product: the allowed variants and their stock are known
// server-side and passed down, so the form refuses an unknown variant or a
// quantity above what's in stock.
export function makeAddToCartSchema(variants: { id: string; stock: number }[]) {
  return z
    .object({
      variantId: z.string().refine((id) => variants.some((v) => v.id === id), {
        message: "Variante inconnue",
      }),
      quantity: z.number().int().min(1, "Quantité minimale : 1"),
    })
    .superRefine((values, ctx) => {
      const variant = variants.find((v) => v.id === values.variantId);
      if (variant && values.quantity > variant.stock) {
        ctx.addIssue({
          code: "custom",
          path: ["quantity"],
          message: `Stock disponible : ${variant.stock}`,
        });
      }
    });
}

export type AddToCartValues = z.infer<ReturnType<typeof makeAddToCartSchema>>;
