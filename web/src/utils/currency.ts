// Items carry their own purchase currency; adding CNY and USD into one
// number is meaningless, so sums are grouped per currency and shown as
// "¥12,345 + $678". Missing currency falls back to CNY (the form default)
// so legacy rows stay in the main bucket.
export interface CurrencyEntry {
  amount?: number | null;
  currency?: string | null;
}

export function currencyOf(currency?: string | null): string {
  return currency && currency.trim() ? currency.trim().toUpperCase() : 'CNY';
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  CNY: '¥',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
};

export function multiCurrencySum(entries: CurrencyEntry[]): string {
  const groups = new Map<string, number>();
  for (const { amount, currency } of entries) {
    if (amount == null) continue;
    const key = currencyOf(currency);
    groups.set(key, (groups.get(key) ?? 0) + amount);
  }
  return Array.from(groups.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([code, sum]) => `${CURRENCY_SYMBOLS[code] ?? `${code} `}${sum.toLocaleString()}`)
    .join(' + ');
}
