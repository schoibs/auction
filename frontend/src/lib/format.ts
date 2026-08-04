import type { IsoDateString } from '../types/api';

const integerFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatCredits(amount: number): string {
  return `${integerFormatter.format(amount)} credits`;
}

export function formatDateTime(value: IsoDateString): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? 'Unknown date'
    : dateTimeFormatter.format(date);
}

export function formatBidder(userId: string, currentUserId?: string): string {
  if (userId === currentUserId) {
    return 'You';
  }

  return userId.length > 8 ? `${userId.slice(0, 8)}…` : userId;
}
