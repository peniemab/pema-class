export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function shiftIsoDate(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function parseIsoDate(raw: string | undefined): string {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return todayIsoDate();
  return raw;
}

export { parseIsoDate };

export function parseIsoDateWithFallback(
  raw: string | undefined,
  fallback: string,
): string {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return fallback;
  return raw;
}

/** Semaine calendaire lun → dim, plafonnée à aujourd'hui. */
export function getWeekRange(anchorDate: string): {
  start: string;
  end: string;
  dayCount: number;
} {
  const anchor = new Date(`${anchorDate}T12:00:00`);
  const day = anchor.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const start = monday.toISOString().slice(0, 10);
  const today = todayIsoDate();
  const end =
    sunday.toISOString().slice(0, 10) > today
      ? today
      : sunday.toISOString().slice(0, 10);

  const dayCount =
    Math.floor(
      (new Date(`${end}T12:00:00`).getTime() -
        new Date(`${start}T12:00:00`).getTime()) /
        86400000,
    ) + 1;

  return { start, end, dayCount: Math.max(dayCount, 0) };
}

export function getPeriodRange(
  days: number,
  endDate?: string,
): { start: string; end: string; dayCount: number } {
  const end = parseIsoDateWithFallback(endDate, todayIsoDate());
  const start = shiftIsoDate(end, -(days - 1));
  return { start, end, dayCount: days };
}
