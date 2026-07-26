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
  return (
    <section className="state-panel" role="alert" aria-labelledby="error-title">
      <h2 id="error-title">{title}</h2>
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
