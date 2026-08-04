import type { CardType } from '../../types/api';
import styles from './card-stats.module.css';

interface CardStatsProps {
  cardType: Pick<CardType, 'attack' | 'midfield' | 'defense'>;
}

export function CardStats({ cardType }: CardStatsProps) {
  return (
    <dl className={styles.stats} aria-label="Card statistics">
      <div>
        <dt>Attack</dt>
        <dd>{cardType.attack}</dd>
      </div>
      <div>
        <dt>Midfield</dt>
        <dd>{cardType.midfield}</dd>
      </div>
      <div>
        <dt>Defense</dt>
        <dd>{cardType.defense}</dd>
      </div>
    </dl>
  );
}
