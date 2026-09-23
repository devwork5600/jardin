export const SHOP_HOURS = [
  { day: "Lundi & jeudi", time: "14h00 – 18h40" },
  { day: "Mardi, mercredi & vendredi", time: "10h00 – 18h40" },
  { day: "Samedi", time: "12h00 – 18h40" },
  { day: "Dimanche", time: "Fermé" },
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Opening time in minutes since midnight, indexed by weekday (0 = Sunday).
const OPENING_MINUTES: (number | null)[] = [null, 840, 600, 600, 840, 600, 720];
const CLOSING_MINUTES = 18 * 60 + 40;

const parisClock = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Paris",
  weekday: "short",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
});

export function isShopOpen(now: Date = new Date()): boolean {
  const parts = Object.fromEntries(
    parisClock.formatToParts(now).map((part) => [part.type, part.value]),
  );
  const opening = OPENING_MINUTES[WEEKDAYS.indexOf(parts.weekday)];
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);

  return opening !== null && minutes >= opening && minutes < CLOSING_MINUTES;
}
