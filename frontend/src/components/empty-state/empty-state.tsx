interface EmptyStateProps {
  title: string;
  message: string;
}

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <section className="state-panel" aria-labelledby="empty-state-title">
      <h2 id="empty-state-title">{title}</h2>
      <p>{message}</p>
    </section>
  );
}
