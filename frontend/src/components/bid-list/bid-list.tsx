import { formatBidder, formatCredits, formatDateTime } from '../../lib/format';
import type { Bid } from '../../types/api';
import styles from './bid-list.module.css';

interface BidListProps {
  bids: Bid[];
  currentUserId?: string;
}

export function BidList({ bids, currentUserId }: BidListProps) {
  if (bids.length === 0) {
    return <p className={styles.empty}>No bids have been placed yet.</p>;
  }

  return (
    <ol className={styles.list}>
      {bids.map((bid) => (
        <li key={bid.id}>
          <div>
            <span className={styles.bidder}>
              {formatBidder(bid.bidderUserId, currentUserId)}
            </span>
            <time dateTime={bid.createdAt}>{formatDateTime(bid.createdAt)}</time>
          </div>
          <strong>{formatCredits(bid.amount)}</strong>
        </li>
      ))}
    </ol>
  );
}
