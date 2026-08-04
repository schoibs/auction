import { useId } from 'react';

interface EmptyStateProps {
  title: string;
  message: string;
}

export function EmptyState({ title, message }: EmptyStateProps) {
  const titleId = useId();

  return (
    <section className="state-panel" aria-labelledby={titleId}>
      <h2 id={titleId}>{title}</h2>
      <p>{message}</p>
    </section>
  );
}
