export function localCalendarDate(nowMs: number = Date.now()): string {
  const d = new Date(nowMs);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function validateDateNotFuture(date: string, today: string): string | null {
  if (date > today) return "date cannot be in the future";
  return null;
}
