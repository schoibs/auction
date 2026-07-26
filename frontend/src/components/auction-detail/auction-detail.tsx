'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/auth-context';
import { apiFetch } from '../../lib/api-client';
import { ApiError, getErrorMessages } from '../../lib/api-error';
import { formatBidder, formatCredits, formatDateTime } from '../../lib/format';
import type { AuctionDetail as AuctionDetailResponse } from '../../types/api';
import { AuctionStatusBadge } from '../auction-status-badge/auction-status-badge';
import { BidList } from '../bid-list/bid-list';
import { CardFace } from '../card-face/card-face';
import { Countdown } from '../countdown/countdown';
import { ErrorState } from '../error-state/error-state';
import { LoadingState } from '../loading-state/loading-state';
import styles from './auction-detail.module.css';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function AuctionDetail({ auctionId }: { auctionId: string }) {
  const { user } = useAuth();
  const isValidAuctionId = UUID_PATTERN.test(auctionId);
  const [auction, setAuction] = useState<AuctionDetailResponse | null>(null);
  const [error, setError] = useState<string[] | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!isValidAuctionId) {
      return;
    }

    const controller = new AbortController();

    setAuction(null);
    setError(null);
    setNotFound(false);

    void apiFetch<AuctionDetailResponse>(`/auctions/${auctionId}`, {
      signal: controller.signal,
    })
      .then(setAuction)
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        if (requestError instanceof ApiError && requestError.status === 404) {
          setNotFound(true);
          return;
        }

        setError(getErrorMessages(requestError));
      });

    return () => controller.abort();
  }, [auctionId, isValidAuctionId, retryKey]);

  if (!isValidAuctionId) {
    return (
      <main className="page-shell" id="main-content">
        <section className="state-panel" aria-labelledby="invalid-link-title">
          <p className="eyebrow">Invalid link</p>
          <h1 id="invalid-link-title">This auction link is not valid</h1>
          <p>Check the address or return to the marketplace.</p>
          <Link href="/auctions">Back to auctions</Link>
        </section>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="page-shell" id="main-content">
        <section className="state-panel" aria-labelledby="not-found-title">
          <p className="eyebrow">Not found</p>
          <h1 id="not-found-title">Auction not found</h1>
          <p>The auction may have been removed or the link may be incorrect.</p>
          <Link href="/auctions">Back to auctions</Link>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page-shell" id="main-content">
        <Link className={styles.backLink} href="/auctions">
          ← Back to auctions
        </Link>
        <ErrorState
          title="Unable to load this auction"
          messages={error}
          onRetry={() => setRetryKey((key) => key + 1)}
        />
      </main>
    );
  }

  if (!auction) {
    return (
      <main className="page-shell" id="main-content">
        <LoadingState label="Loading auction details…" />
      </main>
    );
  }

  const highestBid = auction.currentHighestBid;

  return (
    <main className="page-shell" id="main-content">
      <Link className={styles.backLink} href="/auctions">
        ← Back to auctions
      </Link>

      <article>
        <header className={styles.header}>
          <div>
            <p className="eyebrow">Auction detail</p>
            <h1>{auction.card.cardType.name}</h1>
            <p>Listed by {auction.seller.username}</p>
          </div>
          <AuctionStatusBadge status={auction.status} />
        </header>

        <div className={styles.layout}>
          <section
            className={styles.visual}
            aria-label={`${auction.card.cardType.name} card`}
          >
            <CardFace cardType={auction.card.cardType} />
          </section>

          <div className={styles.information}>
            <section className={styles.pricePanel} aria-labelledby="price-title">
              <p id="price-title">
                {highestBid ? 'Current highest bid' : 'No bids yet'}
              </p>
              <strong>
                {formatCredits(highestBid?.amount ?? auction.startPrice)}
              </strong>
              {highestBid ? (
                <span>
                  {auction.status === 'CLOSED' ? 'Winner' : 'Bidder'}:{' '}
                  {formatBidder(highestBid.bidderUserId, user?.id)}
                </span>
              ) : (
                <span>Starting price</span>
              )}
            </section>

            <section className={styles.detailPanel} aria-labelledby="details-title">
              <h2 id="details-title">Auction details</h2>
              <dl className={styles.details}>
                <div>
                  <dt>Status</dt>
                  <dd>{auction.status.toLowerCase()}</dd>
                </div>
                <div>
                  <dt>Seller</dt>
                  <dd>{auction.seller.username}</dd>
                </div>
                <div>
                  <dt>Start price</dt>
                  <dd>{formatCredits(auction.startPrice)}</dd>
                </div>
                <div>
                  <dt>Started</dt>
                  <dd>
                    <time dateTime={auction.startTime}>
                      {formatDateTime(auction.startTime)}
                    </time>
                  </dd>
                </div>
                <div>
                  <dt>Ends</dt>
                  <dd>
                    <time dateTime={auction.endTime}>
                      {formatDateTime(auction.endTime)}
                    </time>
                  </dd>
                </div>
                {auction.status === 'ACTIVE' ? (
                  <div>
                    <dt>Time remaining</dt>
                    <dd>
                      <Countdown endTime={auction.endTime} />
                    </dd>
                  </div>
                ) : null}
                {auction.closedAt ? (
                  <div>
                    <dt>Closed</dt>
                    <dd>
                      <time dateTime={auction.closedAt}>
                        {formatDateTime(auction.closedAt)}
                      </time>
                    </dd>
                  </div>
                ) : null}
                {auction.cancelledAt ? (
                  <div>
                    <dt>Cancelled</dt>
                    <dd>
                      <time dateTime={auction.cancelledAt}>
                        {formatDateTime(auction.cancelledAt)}
                      </time>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </section>

            <section className={styles.bidPanel} aria-labelledby="recent-bids-title">
              <div className={styles.sectionHeading}>
                <h2 id="recent-bids-title">Recent bids</h2>
                <span>Newest first</span>
              </div>
              <BidList bids={auction.recentBids} currentUserId={user?.id} />
            </section>
          </div>
        </div>
      </article>
    </main>
  );
}
