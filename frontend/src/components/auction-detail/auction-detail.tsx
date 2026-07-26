'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/auth-context';
import { useRealtime } from '../../contexts/realtime-context';
import { useAuctionRoom } from '../../hooks/use-auction-room';
import { apiFetch } from '../../lib/api-client';
import { ApiError, getErrorMessages } from '../../lib/api-error';
import { formatBidder, formatCredits, formatDateTime } from '../../lib/format';
import type { AuctionDetail as AuctionDetailResponse } from '../../types/api';
import { AuctionStatusBadge } from '../auction-status-badge/auction-status-badge';
import { BidForm } from '../bid-form/bid-form';
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
  const { socket } = useRealtime();
  const isValidAuctionId = UUID_PATTERN.test(auctionId);
  const [auction, setAuction] = useState<AuctionDetailResponse | null>(null);
  const [error, setError] = useState<string[] | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string[] | null>(null);
  const [isEnding, setIsEnding] = useState(false);
  const activeRequestRef = useRef<Promise<void> | null>(null);
  const activeControllerRef = useRef<AbortController | null>(null);
  const pendingRefreshRef = useRef(false);
  const requestGenerationRef = useRef(0);
  const endedAuctionRef = useRef<string | null>(null);

  useAuctionRoom(isValidAuctionId ? auctionId : null);

  const fetchAuction = useCallback(
    function requestAuction(
      mode: 'initial' | 'background' = 'background',
    ): Promise<void> {
      if (!isValidAuctionId) {
        return Promise.resolve();
      }

      if (activeRequestRef.current) {
        const activeRequest = activeRequestRef.current;

        if (mode === 'background') {
          pendingRefreshRef.current = true;
          return activeRequest.then(
            () => activeRequestRef.current ?? Promise.resolve(),
          );
        }

        return activeRequest;
      }

      const generation = requestGenerationRef.current;
      const controller = new AbortController();
      activeControllerRef.current = controller;

      if (mode === 'initial') {
        setAuction(null);
        setError(null);
        setNotFound(false);
        setIsUpdating(false);
        setUpdateError(null);
      } else {
        setIsUpdating(true);
        setUpdateError(null);
      }

      const request = apiFetch<AuctionDetailResponse>(`/auctions/${auctionId}`, {
        signal: controller.signal,
      })
        .then((response) => {
          if (requestGenerationRef.current !== generation) {
            return;
          }

          const endTimestamp = new Date(response.endTime).getTime();
          const endedByTime = endTimestamp <= Date.now();
          const nextIsEnding =
            response.status !== 'ACTIVE' ||
            (Number.isFinite(endTimestamp) && endedByTime);

          endedAuctionRef.current = nextIsEnding ? response.id : null;
          setAuction(response);
          setError(null);
          setNotFound(false);
          setIsEnding(nextIsEnding);
        })
        .catch((requestError: unknown) => {
          if (
            requestGenerationRef.current !== generation ||
            controller.signal.aborted
          ) {
            return;
          }

          if (requestError instanceof ApiError && requestError.status === 404) {
            setAuction(null);
            setNotFound(true);
            return;
          }

          const messages = getErrorMessages(requestError);

          if (mode === 'initial') {
            setError(messages);
          } else {
            setUpdateError(messages);
          }
        })
        .finally(() => {
          if (
            requestGenerationRef.current !== generation ||
            activeRequestRef.current !== request
          ) {
            return;
          }

          activeRequestRef.current = null;
          activeControllerRef.current = null;
          setIsUpdating(false);

          if (pendingRefreshRef.current) {
            pendingRefreshRef.current = false;
            void requestAuction('background');
          }
        });

      activeRequestRef.current = request;
      return request;
    },
    [auctionId, isValidAuctionId],
  );

  useEffect(() => {
    if (!isValidAuctionId) {
      return;
    }

    requestGenerationRef.current += 1;
    pendingRefreshRef.current = false;
    endedAuctionRef.current = null;
    setIsEnding(false);
    setUpdateError(null);
    void fetchAuction('initial');

    return () => {
      requestGenerationRef.current += 1;
      pendingRefreshRef.current = false;
      activeControllerRef.current?.abort();
      activeControllerRef.current = null;
      activeRequestRef.current = null;
    };
  }, [fetchAuction, isValidAuctionId]);

  useEffect(() => {
    if (!socket || !isValidAuctionId) {
      return;
    }

    const refreshMatchingAuction = (payload: { auctionId: string }) => {
      if (payload.auctionId === auctionId) {
        void fetchAuction('background');
      }
    };

    const refreshTerminalAuction = (payload: { auctionId: string }) => {
      if (payload.auctionId === auctionId) {
        setIsEnding(true);
        void fetchAuction('background');
      }
    };

    socket.on('auction.bid_placed', refreshMatchingAuction);
    socket.on('auction.outbid', refreshMatchingAuction);
    socket.on('auction.closed', refreshTerminalAuction);
    socket.on('auction.cancelled', refreshTerminalAuction);

    return () => {
      socket.off('auction.bid_placed', refreshMatchingAuction);
      socket.off('auction.outbid', refreshMatchingAuction);
      socket.off('auction.closed', refreshTerminalAuction);
      socket.off('auction.cancelled', refreshTerminalAuction);
    };
  }, [auctionId, fetchAuction, isValidAuctionId, socket]);

  const handleCountdownEnd = useCallback(() => {
    if (endedAuctionRef.current === auctionId) {
      return;
    }

    endedAuctionRef.current = auctionId;
    setIsEnding(true);
    void fetchAuction('background');
  }, [auctionId, fetchAuction]);

  if (!isValidAuctionId) {
    return (
      <main className="page-shell" id="main-content" tabIndex={-1}>
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
      <main className="page-shell" id="main-content" tabIndex={-1}>
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
      <main className="page-shell" id="main-content" tabIndex={-1}>
        <Link className={styles.backLink} href="/auctions">
          ← Back to auctions
        </Link>
        <ErrorState
          title="Unable to load this auction"
          messages={error}
          onRetry={() => void fetchAuction('initial')}
        />
      </main>
    );
  }

  if (!auction) {
    return (
      <main className="page-shell" id="main-content" tabIndex={-1}>
        <LoadingState label="Loading auction details…" />
      </main>
    );
  }

  const highestBid = auction.currentHighestBid;

  return (
    <main className="page-shell" id="main-content" tabIndex={-1}>
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
          <div className={styles.headerStatus}>
            <AuctionStatusBadge status={auction.status} />
            {isUpdating ? (
              <span className={styles.updating} aria-live="polite">
                Updating…
              </span>
            ) : null}
          </div>
        </header>

        {updateError ? (
          <div className={styles.updateError} role="status">
            <span>{updateError.join(' ')}</span>
            <button type="button" onClick={() => void fetchAuction()}>
              Retry update
            </button>
          </div>
        ) : null}

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
                      {isEnding ? (
                        'Closing…'
                      ) : (
                        <Countdown
                          endTime={auction.endTime}
                          onEnd={handleCountdownEnd}
                        />
                      )}
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

            <BidForm
              auction={auction}
              isEnding={isEnding}
              onAuctionChanged={() => fetchAuction('background')}
            />

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
