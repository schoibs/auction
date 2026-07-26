import { useId } from 'react';

interface ErrorStateProps {
  title?: string;
  messages: string[];
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = 'Unable to load this page',
  messages,
  onRetry,
  retryLabel = 'Try again',
}: ErrorStateProps) {
  const titleId = useId();

  return (
    <section className="state-panel" role="alert" aria-labelledby={titleId}>
      <h2 id={titleId}>{title}</h2>
      {messages.map((message) => (
        <p key={message}>{message}</p>
      ))}
      {onRetry ? (
        <button className="primary-button" type="button" onClick={onRetry}>
          {retryLabel}
        </button>
      ) : null}
    </section>
  );
}
