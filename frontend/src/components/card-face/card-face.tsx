import type { CardType } from '../../types/api';
import { CardStats } from '../card-stats/card-stats';
import styles from './card-face.module.css';

function initialsForName(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2);

  return initials || '?';
}

export function CardFace({ cardType }: { cardType: CardType }) {
  return (
    <div className={styles.card}>
      <div className={styles.frame}>
        <p className={styles.typeLabel}>Collector card</p>
        <div className={styles.monogram} aria-hidden="true">
          {initialsForName(cardType.name)}
        </div>
        <p className={styles.name}>{cardType.name}</p>
        <CardStats cardType={cardType} />
      </div>
    </div>
  );
}
