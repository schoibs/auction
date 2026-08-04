'use client';

import type { FormEventHandler, ReactNode } from 'react';
import styles from './auth-form.module.css';

interface AuthFormProps {
  title: string;
  description: string;
  submitLabel: string;
  submittingLabel: string;
  isSubmitting: boolean;
  errorMessages: string[];
  footer: ReactNode;
  children: ReactNode;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

export function AuthForm({
  title,
  description,
  submitLabel,
  submittingLabel,
  isSubmitting,
  errorMessages,
  footer,
  children,
  onSubmit,
}: AuthFormProps) {
  return (
    <main className="page-shell" id="main-content" tabIndex={-1}>
      <section className={styles.panel} aria-labelledby="auth-title">
        <p className="eyebrow">Account</p>
        <h1 className={styles.title} id="auth-title">
          {title}
        </h1>
        <p className={styles.description}>{description}</p>
        <form className={styles.form} noValidate onSubmit={onSubmit}>
          {children}
          {errorMessages.length > 0 ? (
            <div className={styles.formError} aria-live="polite">
              <p>Something went wrong.</p>
              <ul>
                {errorMessages.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <button
            className={styles.submitButton}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? submittingLabel : submitLabel}
          </button>
        </form>
        <div className={styles.footer}>{footer}</div>
      </section>
    </main>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className={styles.fieldError} id={id}>
      {message}
    </p>
  );
}

export const authFormStyles = styles;
