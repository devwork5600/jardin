const euro = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

export function formatPrice(cents: number) {
  return euro.format(cents / 100);
}
