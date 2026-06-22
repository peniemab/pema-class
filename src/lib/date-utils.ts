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
