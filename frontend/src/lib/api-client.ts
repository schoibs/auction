import { ApiError } from './api-error';
import { publicConfig } from './config';

interface ApiFetchOptions extends Omit<RequestInit, 'body' | 'headers'> {
  body?: unknown;
  headers?: HeadersInit;
  token?: string | null;
}

interface NestErrorBody {
  message?: unknown;
  error?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeMessages(body: unknown, status: number): string[] {
  if (isRecord(body)) {
    const nestError = body as NestErrorBody;

    if (Array.isArray(nestError.message)) {
      const messages = nestError.message.filter(
        (message): message is string => typeof message === 'string',
      );

      if (messages.length > 0) {
        return messages;
      }
    }

    if (typeof nestError.message === 'string' && nestError.message.length > 0) {
      return [nestError.message];
    }

    if (typeof nestError.error === 'string' && nestError.error.length > 0) {
      return [nestError.error];
    }
  }

  if (status >= 500) {
    return ['The auction API is unavailable. Please try again.'];
  }

  return ['The auction API could not complete the request.'];
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (text.length === 0) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    if (!response.ok) {
      return undefined;
    }

    throw new ApiError('The auction API returned an invalid response.', {
      status: response.status,
      cause: error,
    });
  }
}

export async function apiFetch<T = undefined>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { body, headers, token, ...requestOptions } = options;
  const requestHeaders = new Headers(headers);

  requestHeaders.set('Accept', 'application/json');

  if (body === undefined) {
    requestHeaders.delete('Content-Type');
  } else {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  const requestPath = path.startsWith('/') ? path : `/${path}`;

  let response: Response;

  try {
    response = await fetch(`${publicConfig.apiUrl}${requestPath}`, {
      ...requestOptions,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    throw new ApiError('Cannot reach the auction API.', {
      status: null,
      cause: error,
    });
  }

  const responseBody = await readResponseBody(response);

  if (!response.ok) {
    throw new ApiError(normalizeMessages(responseBody, response.status), {
      status: response.status,
      cause: responseBody,
    });
  }

  return responseBody as T;
}
