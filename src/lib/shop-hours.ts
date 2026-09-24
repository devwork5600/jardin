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

export type PickupDay = {
  iso: string; // calendar date in Paris, YYYY-MM-DD
  label: string; // "Demain", then the weekday name
  hours: string; // "10h00 – 18h40"
};

const parisDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const weekdayName = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "UTC",
  weekday: "long",
});

function formatMinutes(total: number) {
  const hours = Math.floor(total / 60);
  const minutes = String(total % 60).padStart(2, "0");
  return `${hours}h${minutes}`;
}

// Orders are prepared in-store, so the earliest pickup is tomorrow (Paris
// time); closed days are skipped. Works on calendar dates only, never on
// 24h offsets, so DST changes can't repeat or skip a day.
export function getPickupDays(now: Date = new Date(), count = 4): PickupDay[] {
  const [year, month, day] = parisDate.format(now).split("-").map(Number);
  const days: PickupDay[] = [];

  for (let offset = 1; days.length < count && offset <= 14; offset++) {
    const date = new Date(Date.UTC(year, month - 1, day + offset));
    const opening = OPENING_MINUTES[date.getUTCDay()];
    if (opening === null) continue;

    const name = weekdayName.format(date);
    days.push({
      iso: date.toISOString().slice(0, 10),
      label: offset === 1 ? "Demain" : name.charAt(0).toUpperCase() + name.slice(1),
      hours: `${formatMinutes(opening)} – ${formatMinutes(CLOSING_MINUTES)}`,
    });
  }

  return days;
}
