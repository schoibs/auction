import Link from 'next/link';
import { formatBidder, formatCredits, formatDateTime } from '../../lib/format';
import type { AuctionDetail } from '../../types/api';
import { AuctionStatusBadge } from '../auction-status-badge/auction-status-badge';
import { CardFace } from '../card-face/card-face';
import { Countdown } from '../countdown/countdown';
import styles from './auction-card.module.css';

interface AuctionCardProps {
  auction: AuctionDetail;
  currentUserId?: string;
}

export function AuctionCard({ auction, currentUserId }: AuctionCardProps) {
  const highestBid = auction.currentHighestBid;
  const isActive = auction.status === 'ACTIVE';

  return (
    <article className={styles.card}>
      <Link
        className={styles.faceLink}
        href={`/auctions/${auction.id}`}
        aria-label={`View ${auction.card.cardType.name} auction`}
      >
        <CardFace cardType={auction.card.cardType} />
      </Link>

      <div className={styles.content}>
        <div className={styles.heading}>
          <h2>
            <Link href={`/auctions/${auction.id}`}>
              {auction.card.cardType.name}
            </Link>
          </h2>
          <AuctionStatusBadge status={auction.status} />
        </div>

        <p className={styles.priceLabel}>
          {highestBid ? 'Highest bid' : 'Starting price'}
        </p>
        <p className={styles.price}>
          {formatCredits(highestBid?.amount ?? auction.startPrice)}
        </p>

        {highestBid ? (
          <p className={styles.bidder}>
            {auction.status === 'CLOSED' ? 'Winner' : 'Bidder'}:{' '}
            {formatBidder(highestBid.bidderUserId, currentUserId)}
          </p>
        ) : auction.status === 'CLOSED' ? (
          <p className={styles.bidder}>Closed without a winning bid</p>
        ) : null}

        <dl className={styles.details}>
          <div>
            <dt>Seller</dt>
            <dd>{auction.seller.username}</dd>
          </div>
          <div>
            <dt>{isActive ? 'Time remaining' : 'Closed'}</dt>
            <dd>
              {isActive ? (
                <Countdown endTime={auction.endTime} />
              ) : auction.closedAt ? (
                <time dateTime={auction.closedAt}>
                  {formatDateTime(auction.closedAt)}
                </time>
              ) : (
                'Not available'
              )}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
