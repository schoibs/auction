const DEFAULT_API_URL = 'http://localhost:3000';
const DEFAULT_MIN_DURATION_SECONDS = 30;
const DEFAULT_MAX_DURATION_SECONDS = 604800;

function parsePublicInteger(name: string, fallback: number): number {
  const rawValue = process.env[name];

  if (rawValue === undefined || rawValue.trim() === '') {
    return fallback;
  }

  const value = Number(rawValue);

  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer.`);
  }

  return value;
}

const minDurationSeconds = parsePublicInteger(
  'NEXT_PUBLIC_AUCTION_MIN_DURATION_SECONDS',
  DEFAULT_MIN_DURATION_SECONDS,
);
const maxDurationSeconds = parsePublicInteger(
  'NEXT_PUBLIC_AUCTION_MAX_DURATION_SECONDS',
  DEFAULT_MAX_DURATION_SECONDS,
);

if (minDurationSeconds > maxDurationSeconds) {
  throw new Error(
    'NEXT_PUBLIC_AUCTION_MIN_DURATION_SECONDS must not exceed NEXT_PUBLIC_AUCTION_MAX_DURATION_SECONDS.',
  );
}

export const publicConfig = Object.freeze({
  apiUrl: process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_API_URL,
  socketUrl:
    process.env.NEXT_PUBLIC_SOCKET_URL?.trim() || DEFAULT_API_URL,
  auctionMinDurationSeconds: minDurationSeconds,
  auctionMaxDurationSeconds: maxDurationSeconds,
});

