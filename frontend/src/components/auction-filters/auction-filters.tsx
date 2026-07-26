import type { CardType } from '../../types/api';
import styles from './auction-filters.module.css';

export type MarketplaceStatus = 'ACTIVE' | 'CLOSED';

interface AuctionFiltersProps {
  status: MarketplaceStatus;
  cardTypeId: string | null;
  cardTypes: CardType[];
  disabled?: boolean;
  onStatusChange(status: MarketplaceStatus): void;
  onCardTypeChange(cardTypeId: string | null): void;
  onRefresh(): void;
}

export function AuctionFilters({
  status,
  cardTypeId,
  cardTypes,
  disabled = false,
  onStatusChange,
  onCardTypeChange,
  onRefresh,
}: AuctionFiltersProps) {
  return (
    <section className={styles.filters} aria-label="Auction filters">
      <div className={styles.statusGroup} aria-label="Auction status">
        <button
          className={status === 'ACTIVE' ? styles.activeTab : styles.tab}
          type="button"
          aria-pressed={status === 'ACTIVE'}
          disabled={disabled}
          onClick={() => onStatusChange('ACTIVE')}
        >
          Live
        </button>
        <button
          className={status === 'CLOSED' ? styles.activeTab : styles.tab}
          type="button"
          aria-pressed={status === 'CLOSED'}
          disabled={disabled}
          onClick={() => onStatusChange('CLOSED')}
        >
          Completed
        </button>
      </div>

      <div className={styles.selectGroup}>
        <label htmlFor="card-type-filter">Card type</label>
        <select
          id="card-type-filter"
          value={cardTypeId ?? ''}
          disabled={disabled}
          onChange={(event) => onCardTypeChange(event.target.value || null)}
        >
          <option value="">All card types</option>
          {cardTypes.map((cardType) => (
            <option value={cardType.id} key={cardType.id}>
              {cardType.name}
            </option>
          ))}
        </select>
      </div>

      <button
        className={styles.refresh}
        type="button"
        disabled={disabled}
        onClick={onRefresh}
      >
        Refresh
      </button>
    </section>
  );
}
