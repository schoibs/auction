'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/auth-context';
import { getErrorMessages } from '../../lib/api-error';
import {
  type RegisterFieldErrors,
  validateRegisterInput,
} from '../../lib/validation';
import { AuthForm, authFormStyles, FieldError } from './auth-form';

export function RegisterForm() {
  const router = useRouter();
  const { register, status } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/auctions');
    }
  }, [router, status]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const input = {
      email: email.trim(),
      username: username.trim(),
      password,
    };
    const nextFieldErrors = validateRegisterInput(input, confirmPassword);

    setFieldErrors(nextFieldErrors);
    setErrorMessages([]);

    if (Object.keys(nextFieldErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await register(input);
      router.replace('/auctions');
    } catch (error) {
      setErrorMessages(getErrorMessages(error, 'Unable to register.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || status === 'authenticated') {
    return (
      <main className="page-shell" id="main-content" tabIndex={-1}>
        <section className="state-panel" aria-live="polite">
          <p>{status === 'loading' ? 'Checking your session…' : 'Redirecting…'}</p>
        </section>
      </main>
    );
  }

  return (
    <AuthForm
      title="Create account"
      description="Bid and list your cards."
      submitLabel="Register"
      submittingLabel="Creating account…"
      isSubmitting={isSubmitting}
      errorMessages={errorMessages}
      onSubmit={handleSubmit}
      footer={
        <p>
          Have an account? <Link href="/login">Log in</Link>
        </p>
      }
    >
      <div className={authFormStyles.field}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? 'email-error' : undefined}
          onChange={(event) => setEmail(event.target.value)}
        />
        <FieldError id="email-error" message={fieldErrors.email} />
      </div>
      <div className={authFormStyles.field}>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          minLength={3}
          pattern="[a-zA-Z0-9_]+"
          value={username}
          aria-invalid={Boolean(fieldErrors.username)}
          aria-describedby={fieldErrors.username ? 'username-error' : undefined}
          onChange={(event) => setUsername(event.target.value)}
        />
        <FieldError id="username-error" message={fieldErrors.username} />
      </div>
      <div className={authFormStyles.field}>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={fieldErrors.password ? 'password-error' : undefined}
          onChange={(event) => setPassword(event.target.value)}
        />
        <FieldError id="password-error" message={fieldErrors.password} />
      </div>
      <div className={authFormStyles.field}>
        <label htmlFor="confirm-password">Confirm password</label>
        <input
          id="confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirmPassword}
          aria-invalid={Boolean(fieldErrors.confirmPassword)}
          aria-describedby={
            fieldErrors.confirmPassword ? 'confirm-password-error' : undefined
          }
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
        <FieldError
          id="confirm-password-error"
          message={fieldErrors.confirmPassword}
        />
      </div>
    </AuthForm>
  );
}
