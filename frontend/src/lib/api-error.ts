export interface ApiErrorOptions {
  status: number | null;
  cause?: unknown;
}

export class ApiError extends Error {
  readonly status: number | null;
  readonly messages: string[];
  override readonly cause?: unknown;

  constructor(messages: string | string[], options: ApiErrorOptions) {
    const normalizedMessages = Array.isArray(messages) ? messages : [messages];

    super(normalizedMessages[0]);
    this.name = 'ApiError';
    this.status = options.status;
    this.messages = normalizedMessages;
    this.cause = options.cause;
  }
}

export function getErrorMessages(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string[] {
  if (error instanceof ApiError) {
    return error.messages;
  }

  return [fallback];
}
