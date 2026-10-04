const NARROW_NO_BREAK_SPACE = " ";
const MINUS_SIGN = "−";

const RELATIVE_TIME_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

export const formatNumber = (value: number, maximumFractionDigits = 1) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits }).format(value).replace("-", MINUS_SIGN);

export const formatPercent = (value: number, maximumFractionDigits = 1) =>
  `${formatNumber(value, maximumFractionDigits)}${NARROW_NO_BREAK_SPACE}%`;

export const formatDelta = (value: number, unit: "count" | "percent" = "count") => {
  const magnitude = unit === "percent" ? formatPercent(Math.abs(value)) : formatNumber(Math.abs(value));
  if (value === 0) return magnitude;
  return `${value < 0 ? MINUS_SIGN : "+"}${magnitude}`;
};

export const formatRelativeTime = (date: Date | string | number, now: Date = new Date()) => {
  const elapsed = now.getTime() - new Date(date).getTime();

  for (const [unit, duration] of RELATIVE_TIME_UNITS) {
    if (elapsed >= duration) {
      return new Intl.RelativeTimeFormat("fr", { style: "short" }).format(-Math.floor(elapsed / duration), unit);
    }
  }
  return new Intl.RelativeTimeFormat("fr", { numeric: "auto" }).format(0, "second");
};

export const formatDate = (date: Date | string | number) =>
  new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(date));

// La date longue de la charte, hors des listes : « 25 sept. 2026 à 14:32 ».
export const formatLongDateTime = (date: Date | string | number) => {
  const value = new Date(date);
  const day = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(value);
  const time = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(value);
  return `${day} à ${time}`;
};

export const formatDeviceName =(model: string, serial: string) => `${model} · #${serial.slice(-4).toUpperCase()}`;

export const formatInitials = (name: string) => {
  const [first = "", ...others] = name.trim().split(/\s+/);
  const last = others.at(-1);
  const letters = last ? first.charAt(0) + last.charAt(0) : first.slice(0, 2);
  return letters.toUpperCase();
};
