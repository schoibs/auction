import styles from './loading-state.module.css';

interface LoadingStateProps {
  label?: string;
  cardCount?: number;
}

export function LoadingState({
  label = 'Loading…',
  cardCount = 0,
}: LoadingStateProps) {
  if (cardCount > 0) {
    return (
      <section className={styles.grid} aria-live="polite" aria-busy="true">
        <p className="sr-only">{label}</p>
        {Array.from({ length: cardCount }, (_, index) => (
          <div className={styles.card} aria-hidden="true" key={index}>
            <div className={styles.face} />
            <div className={styles.line} />
            <div className={styles.shortLine} />
          </div>
        ))}
      </section>
    );
  }

  return (
    <section className="state-panel" aria-live="polite" aria-busy="true">
      <p className={styles.message}>{label}</p>
    </section>
  );
}
