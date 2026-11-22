// Date-only strings ("2026-11-25") must be interpreted as LOCAL midnight.
// `new Date("2026-11-25")` parses as UTC midnight, which renders one day
// early (and fires reminders at the wrong hour) for UTC-negative timezones.
export function dateOnlyToUnix(value: string): number | undefined {
  if (!value) return undefined;
  if (value.includes('T')) {
    const ts = new Date(value).getTime();
    return Number.isNaN(ts) ? undefined : Math.floor(ts / 1000);
  }
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return Math.floor(new Date(y, m - 1, d).getTime() / 1000);
}
