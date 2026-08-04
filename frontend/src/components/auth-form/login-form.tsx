'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/auth-context';
import { getErrorMessages } from '../../lib/api-error';
import {
  type LoginFieldErrors,
  validateLoginInput,
} from '../../lib/validation';
import { AuthForm, authFormStyles, FieldError } from './auth-form';

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const { login, status } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(nextPath);
    }
  }, [nextPath, router, status]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const input = { email: email.trim(), password };
    const nextFieldErrors = validateLoginInput(input);

    setFieldErrors(nextFieldErrors);
    setErrorMessages([]);

    if (Object.keys(nextFieldErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await login(input);
      router.replace(nextPath);
    } catch (error) {
      setErrorMessages(getErrorMessages(error, 'Unable to log in.'));
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
      title="Welcome back"
      description="Bid and manage your cards."
      submitLabel="Log in"
      submittingLabel="Logging in…"
      isSubmitting={isSubmitting}
      errorMessages={errorMessages}
      onSubmit={handleSubmit}
      footer={
        <p>
          New? <Link href="/register">Create an account</Link>
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
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          value={password}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={fieldErrors.password ? 'password-error' : undefined}
          onChange={(event) => setPassword(event.target.value)}
        />
        <FieldError id="password-error" message={fieldErrors.password} />
      </div>
    </AuthForm>
  );
}
