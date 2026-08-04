import type { CardType } from '../../types/api';
import styles from './auction-filters.module.css';

export type MarketplaceStatus = 'ACTIVE' | 'CLOSED';

interface AuctionFiltersProps {
  status: MarketplaceStatus;
  cardTypeId: string | null;
  cardTypes: CardType[];
  disabled?: boolean;
  isRefreshing?: boolean;
  onStatusChange(status: MarketplaceStatus): void;
  onCardTypeChange(cardTypeId: string | null): void;
  onRefresh(): void;
}

export function AuctionFilters({
  status,
  cardTypeId,
  cardTypes,
  disabled = false,
  isRefreshing = false,
  onStatusChange,
  onCardTypeChange,
  onRefresh,
}: AuctionFiltersProps) {
  return (
    <section className={styles.filters} aria-label="Auction filters">
      <div
        className={styles.statusGroup}
        role="group"
        aria-label="Auction status"
      >
        <button
          className={status === 'ACTIVE' ? styles.activeTab : styles.tab}
          type="button"
          aria-pressed={status === 'ACTIVE'}
          disabled={disabled}
          onClick={() => onStatusChange('ACTIVE')}
        >
          <svg
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 16 16"
            fill="none"
          >
            <circle cx="8" cy="8" r="2" fill="currentColor" />
            <path
              d="M4.5 4.5a5 5 0 0 0 0 7M11.5 4.5a5 5 0 0 1 0 7"
              stroke="currentColor"
              strokeLinecap="round"
            />
          </svg>
          Live
        </button>
        <button
          className={status === 'CLOSED' ? styles.activeTab : styles.tab}
          type="button"
          aria-pressed={status === 'CLOSED'}
          disabled={disabled}
          onClick={() => onStatusChange('CLOSED')}
        >
          <svg
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 16 16"
            fill="none"
          >
            <circle cx="8" cy="8" r="5.5" stroke="currentColor" />
            <path
              d="m5.5 8 1.6 1.6 3.5-3.5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Completed
        </button>
      </div>

      <div className={styles.selectGroup}>
        <label className="sr-only" htmlFor="card-type-filter">
          Card type
        </label>
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
        disabled={disabled || isRefreshing}
        onClick={onRefresh}
      >
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="M12.7 5.6A5.2 5.2 0 1 0 13 9"
            stroke="currentColor"
            strokeLinecap="round"
          />
          <path
            d="M10.6 5.6h2.2V3.4"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {isRefreshing ? 'Refreshing…' : 'Refresh'}
      </button>
    </section>
  );
}
