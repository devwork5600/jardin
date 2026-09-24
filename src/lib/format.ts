const euro = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

export function formatPrice(cents: number) {
  return euro.format(cents / 100);
}

const orderDate = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  day: "numeric",
  month: "short",
  year: "numeric",
});

// "18 sept. 2026"
export function formatOrderDate(date: Date) {
  return orderDate.format(date);
}

const pickupDay = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "UTC", // pickupDate is stored as the calendar date at 00:00 UTC
  weekday: "long",
  day: "numeric",
  month: "long",
});

// "Samedi 26 septembre" (French months stay lowercase)
export function formatPickupDay(date: Date) {
  return pickupDay.format(date).replace(/^./, (c) => c.toUpperCase());
}
