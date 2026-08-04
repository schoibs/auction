import type { AuctionStatus } from '../../types/api';
import styles from './auction-status-badge.module.css';

const labels: Record<AuctionStatus, string> = {
  ACTIVE: 'Live',
  CLOSING: 'Closing',
  CLOSED: 'Completed',
  CANCELLED: 'Cancelled',
};

export function AuctionStatusBadge({ status }: { status: AuctionStatus }) {
  return (
    <span className={`${styles.badge} ${styles[status.toLowerCase()]}`}>
      {labels[status]}
    </span>
  );
}
