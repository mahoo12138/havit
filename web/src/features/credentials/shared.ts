import { dateOnlyToUnix } from '../../utils/date';

export type WarrantyFilter = '' | 'expiring' | 'expired';

export function warrantyDaysLeft(warrantyExpiresAt?: number): number | null {
  if (!warrantyExpiresAt) return null;
  const now = Math.floor(Date.now() / 1000);
  // Truncate toward zero so "0 days left" meets "0 days overdue" at the
  // expiry instant — flooring made an item hours overdue read "1 day".
  return Math.trunc((warrantyExpiresAt - now) / 86400);
}

export function toUnixSeconds(dateValue: string): number | undefined {
  return dateOnlyToUnix(dateValue);
}

export function fromUnixSeconds(ts?: number): string {
  if (!ts) return '';
  const date = new Date(ts * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
