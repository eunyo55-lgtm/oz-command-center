import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export function formatNumber(n: number): string {
  return n.toLocaleString('ko-KR');
}

export function formatKRW(n: number, compact = false): string {
  if (compact) {
    if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
    if (n >= 10000) return `${(n / 10000).toFixed(0)}만`;
  }
  return `₩${n.toLocaleString('ko-KR')}`;
}

export function formatPct(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

export function formatDelta(n: number | null): { text: string; isPositive: boolean } | null {
  if (n === null || n === undefined) return null;
  const sign = n > 0 ? '+' : '';
  return {
    text: `${sign}${n.toFixed(0)}%`,
    isPositive: n >= 0,
  };
}

export function timeAgo(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ko });
  } catch {
    return iso;
  }
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
