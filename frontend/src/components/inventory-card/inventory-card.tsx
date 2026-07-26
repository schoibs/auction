import { formatDateTime } from '../../lib/format';
import type { Card } from '../../types/api';
import { CardFace } from '../card-face/card-face';
import styles from './inventory-card.module.css';

interface InventoryCardProps {
  card: Card;
  onCreateAuction(card: Card): void;
}

export function InventoryCard({ card, onCreateAuction }: InventoryCardProps) {
  const isOwned = card.status === 'OWNED';
  const titleId = `inventory-card-${card.id}`;
  const actionDescriptionId = `inventory-action-${card.id}`;

  return (
    <article className={styles.card} aria-labelledby={titleId}>
      <CardFace cardType={card.cardType} />

      <div className={styles.details}>
        <div className={styles.heading}>
          <h3 id={titleId}>{card.cardType.name}</h3>
          <span className={isOwned ? styles.owned : styles.locked}>
            {isOwned ? 'Owned' : 'In auction'}
          </span>
        </div>

        <p className={styles.created}>Added {formatDateTime(card.createdAt)}</p>

        {isOwned ? (
          <button
            className="primary-button"
            type="button"
            onClick={() => onCreateAuction(card)}
          >
            Create auction
          </button>
        ) : (
          <div className={styles.lockedAction}>
            <button
              type="button"
              disabled
              aria-describedby={actionDescriptionId}
            >
              Already in auction
            </button>
            <p id={actionDescriptionId}>
              This card is locked until its auction finishes.
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
