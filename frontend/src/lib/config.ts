const DEFAULT_API_URL = 'http://localhost:3000';
const DEFAULT_MIN_DURATION_SECONDS = 30;
const DEFAULT_MAX_DURATION_SECONDS = 604800;

function parsePublicInteger(
  name: string,
  rawValue: string | undefined,
  fallback: number,
): number {
  if (rawValue === undefined || rawValue.trim() === '') {
    return fallback;
  }

  const value = Number(rawValue);

  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer.`);
  }

  return value;
}

function parsePublicUrl(
  name: string,
  rawValue: string | undefined,
  fallback: string,
): string {
  const value = rawValue?.trim() || fallback;

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid absolute URL.`);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`${name} must use http or https.`);
  }

  return value.replace(/\/+$/, '');
}

const minDurationSeconds = parsePublicInteger(
  'NEXT_PUBLIC_AUCTION_MIN_DURATION_SECONDS',
  process.env.NEXT_PUBLIC_AUCTION_MIN_DURATION_SECONDS,
  DEFAULT_MIN_DURATION_SECONDS,
);
const maxDurationSeconds = parsePublicInteger(
  'NEXT_PUBLIC_AUCTION_MAX_DURATION_SECONDS',
  process.env.NEXT_PUBLIC_AUCTION_MAX_DURATION_SECONDS,
  DEFAULT_MAX_DURATION_SECONDS,
);

if (minDurationSeconds > maxDurationSeconds) {
  throw new Error(
    'NEXT_PUBLIC_AUCTION_MIN_DURATION_SECONDS must not exceed NEXT_PUBLIC_AUCTION_MAX_DURATION_SECONDS.',
  );
}

export const publicConfig = Object.freeze({
  apiUrl: parsePublicUrl(
    'NEXT_PUBLIC_API_URL',
    process.env.NEXT_PUBLIC_API_URL,
    DEFAULT_API_URL,
  ),
  socketUrl: parsePublicUrl(
    'NEXT_PUBLIC_SOCKET_URL',
    process.env.NEXT_PUBLIC_SOCKET_URL,
    DEFAULT_API_URL,
  ),
  auctionMinDurationSeconds: minDurationSeconds,
  auctionMaxDurationSeconds: maxDurationSeconds,
});
