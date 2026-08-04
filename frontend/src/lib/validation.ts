import type { LoginInput, RegisterInput } from '../types/api';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;

export type LoginFieldErrors = Partial<Record<keyof LoginInput, string>>;
export type RegisterFieldErrors = Partial<
  Record<keyof RegisterInput | 'confirmPassword', string>
>;

export function validateLoginInput(input: LoginInput): LoginFieldErrors {
  const errors: LoginFieldErrors = {};

  if (!input.email) {
    errors.email = 'Enter your email address.';
  } else if (!EMAIL_PATTERN.test(input.email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!input.password) {
    errors.password = 'Enter your password.';
  } else if (input.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  return errors;
}

export function validateRegisterInput(
  input: RegisterInput,
  confirmPassword: string,
): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {
    ...validateLoginInput(input),
  };

  if (!input.username) {
    errors.username = 'Enter a username.';
  } else if (input.username.length < 3) {
    errors.username = 'Username must be at least 3 characters.';
  } else if (!USERNAME_PATTERN.test(input.username)) {
    errors.username =
      'Username can only contain letters, numbers, and underscores.';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Confirm your password.';
  } else if (confirmPassword !== input.password) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}

export function safeReturnPath(value: unknown, fallback = '/auctions'): string {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.startsWith('/\\')
  ) {
    return fallback;
  }

  return value;
}
