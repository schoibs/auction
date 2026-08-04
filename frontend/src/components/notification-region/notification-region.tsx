'use client';

import Link from 'next/link';
import { useRealtime } from '../../contexts/realtime-context';
import { formatCredits } from '../../lib/format';
import styles from './notification-region.module.css';

export function NotificationRegion() {
  const { dismissOutbidNotification, outbidNotifications } = useRealtime();

  return (
    <aside
      className={styles.region}
      aria-label="Auction notifications"
      aria-live="polite"
    >
      <ul>
        {outbidNotifications.map((notification) => (
          <li key={notification.id} className={styles.notification}>
            <div>
              <strong>You have been outbid.</strong>
              <p>
                The new highest bid is {formatCredits(notification.amount)}.{' '}
                <Link href={`/auctions/${notification.auctionId}`}>
                  View auction
                </Link>
              </p>
            </div>
            <button
              type="button"
              aria-label="Dismiss outbid notification"
              onClick={() => dismissOutbidNotification(notification.id)}
            >
              Dismiss
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
