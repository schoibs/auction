'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/auth-context';
import { useRealtime } from '../../contexts/realtime-context';
import { apiFetch } from '../../lib/api-client';
import { getErrorMessages } from '../../lib/api-error';
import type { AuctionDetail, CardType, CursorPage } from '../../types/api';
import {
  AuctionFilters,
  type MarketplaceStatus,
} from '../auction-filters/auction-filters';
import { EmptyState } from '../empty-state/empty-state';
import { ErrorState } from '../error-state/error-state';
import { LoadingState } from '../loading-state/loading-state';
import { AuctionCard } from './auction-card';
import styles from './auction-marketplace.module.css';

const PAGE_SIZE = 25;

function marketplacePath(
  status: MarketplaceStatus,
  cardTypeId: string | null,
): string {
  const params = new URLSearchParams({ status });

  if (cardTypeId) {
    params.set('cardTypeId', cardTypeId);
  }

  return `/auctions?${params.toString()}`;
}

function auctionsPath(
  status: MarketplaceStatus,
  cardTypeId: string | null,
  cursor?: string,
): string {
  const params = new URLSearchParams({
    status,
    limit: String(PAGE_SIZE),
  });

  if (cardTypeId) {
    params.set('cardTypeId', cardTypeId);
  }

  if (cursor) {
    params.set('cursor', cursor);
  }

  return `/auctions?${params.toString()}`;
}

export function AuctionMarketplace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { socket } = useRealtime();
  const rawStatus = searchParams.get('status');
  const rawCardTypeId = searchParams.get('cardTypeId');
  const status: MarketplaceStatus =
    rawStatus === 'CLOSED' ? 'CLOSED' : 'ACTIVE';

  const [cardTypes, setCardTypes] = useState<CardType[] | null>(null);
  const [cardTypesError, setCardTypesError] = useState<string[] | null>(null);
  const [cardTypesRetry, setCardTypesRetry] = useState(0);
  const [auctions, setAuctions] = useState<AuctionDetail[] | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [listError, setListError] = useState<string[] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string[] | null>(null);
  const [newAuctionAvailable, setNewAuctionAvailable] = useState(false);

  const selectedCardTypeId =
    cardTypes?.some((cardType) => cardType.id === rawCardTypeId) === true
      ? rawCardTypeId
      : null;
  const filterKey = `${status}:${selectedCardTypeId ?? ''}`;
  const filterKeyRef = useRef(filterKey);
  filterKeyRef.current = filterKey;

  useEffect(() => {
    setNewAuctionAvailable(false);
  }, [filterKey]);

  useEffect(() => {
    if (!socket || status !== 'ACTIVE') {
      return;
    }

    const handleAuctionCreated = () => setNewAuctionAvailable(true);
    socket.on('auction.created', handleAuctionCreated);

    return () => {
      socket.off('auction.created', handleAuctionCreated);
    };
  }, [socket, status]);

  useEffect(() => {
    const controller = new AbortController();

    setCardTypes(null);
    setCardTypesError(null);

    void apiFetch<CardType[]>('/card-types', { signal: controller.signal })
      .then(setCardTypes)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setCardTypesError(getErrorMessages(error));
        }
      });

    return () => controller.abort();
  }, [cardTypesRetry]);

  useEffect(() => {
    if (cardTypes === null) {
      return;
    }

    const needsUrlNormalization =
      rawStatus !== status || rawCardTypeId !== selectedCardTypeId;

    if (needsUrlNormalization) {
      router.replace(marketplacePath(status, selectedCardTypeId), {
        scroll: false,
      });
      return;
    }

    const controller = new AbortController();

    setAuctions(null);
    setNextCursor(null);
    setListError(null);
    setIsLoadingMore(false);
    setLoadMoreError(null);

    void apiFetch<CursorPage<AuctionDetail>>(
      auctionsPath(status, selectedCardTypeId),
      { signal: controller.signal },
    )
      .then((page) => {
        setAuctions(page.items);
        setNextCursor(page.nextCursor);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setListError(getErrorMessages(error));
        }
      });

    return () => controller.abort();
  }, [
    cardTypes,
    rawCardTypeId,
    rawStatus,
    refreshKey,
    router,
    selectedCardTypeId,
    status,
  ]);

  function updateFilters(
    nextStatus: MarketplaceStatus,
    nextCardTypeId: string | null,
  ) {
    router.replace(marketplacePath(nextStatus, nextCardTypeId), {
      scroll: false,
    });
  }

  function refreshAuctions() {
    setNewAuctionAvailable(false);
    setRefreshKey((key) => key + 1);
  }

  async function loadMore() {
    if (!nextCursor || isLoadingMore) {
      return;
    }

    const requestFilterKey = filterKey;
    setIsLoadingMore(true);
    setLoadMoreError(null);

    try {
      const page = await apiFetch<CursorPage<AuctionDetail>>(
        auctionsPath(status, selectedCardTypeId, nextCursor),
      );

      if (filterKeyRef.current !== requestFilterKey) {
        return;
      }

      setAuctions((current) => {
        const existingIds = new Set(current?.map((auction) => auction.id));
        const uniqueItems = page.items.filter(
          (auction) => !existingIds.has(auction.id),
        );

        return [...(current ?? []), ...uniqueItems];
      });
      setNextCursor(page.nextCursor);
    } catch (error) {
      if (filterKeyRef.current === requestFilterKey) {
        setLoadMoreError(getErrorMessages(error));
      }
    } finally {
      if (filterKeyRef.current === requestFilterKey) {
        setIsLoadingMore(false);
      }
    }
  }

  return (
    <main className="page-shell" id="main-content">
      <header className={styles.pageHeader}>
        <div>
          <p className="eyebrow">Marketplace</p>
          <h1>Find your next card</h1>
          <p>Browse live auctions or review recently completed sales.</p>
        </div>
      </header>

      {cardTypes === null ? (
        cardTypesError ? (
          <ErrorState
            messages={cardTypesError}
            onRetry={() => setCardTypesRetry((retry) => retry + 1)}
          />
        ) : (
          <LoadingState label="Loading auction filters…" />
        )
      ) : (
        <>
          <AuctionFilters
            status={status}
            cardTypeId={selectedCardTypeId}
            cardTypes={cardTypes}
            disabled={auctions === null && listError === null}
            onStatusChange={(nextStatus) =>
              updateFilters(nextStatus, selectedCardTypeId)
            }
            onCardTypeChange={(cardTypeId) =>
              updateFilters(status, cardTypeId)
            }
            onRefresh={refreshAuctions}
          />

          {newAuctionAvailable ? (
            <div className={styles.newAuctionNotice} aria-live="polite">
              <span>A new auction is available.</span>
              <button type="button" onClick={refreshAuctions}>
                Refresh auctions
              </button>
            </div>
          ) : null}

          <section
            className={styles.results}
            aria-labelledby="auction-results-title"
          >
            <div className={styles.resultsHeading}>
              <h2 id="auction-results-title">
                {status === 'ACTIVE' ? 'Live auctions' : 'Completed auctions'}
              </h2>
              {selectedCardTypeId ? (
                <p>
                  {
                    cardTypes.find(
                      (cardType) => cardType.id === selectedCardTypeId,
                    )?.name
                  }
                </p>
              ) : null}
            </div>

            {auctions === null ? (
              listError ? (
                <ErrorState
                  messages={listError}
                  onRetry={refreshAuctions}
                />
              ) : (
                <LoadingState label="Loading auctions…" cardCount={4} />
              )
            ) : auctions.length === 0 ? (
              <EmptyState
                title={`No ${status === 'ACTIVE' ? 'live' : 'completed'} auctions`}
                message="Try another card type or refresh this view."
              />
            ) : (
              <>
                <div className={styles.grid}>
                  {auctions.map((auction) => (
                    <AuctionCard
                      auction={auction}
                      currentUserId={user?.id}
                      key={auction.id}
                    />
                  ))}
                </div>

                {loadMoreError ? (
                  <div className={styles.incrementalError}>
                    <ErrorState
                      title="Could not load more auctions"
                      messages={loadMoreError}
                      onRetry={() => void loadMore()}
                      retryLabel="Retry loading more"
                    />
                  </div>
                ) : null}

                {nextCursor && !loadMoreError ? (
                  <div className={styles.loadMore}>
                    <button
                      className="primary-button"
                      type="button"
                      disabled={isLoadingMore}
                      onClick={() => void loadMore()}
                    >
                      {isLoadingMore ? 'Loading more…' : 'Load more'}
                    </button>
                    {isLoadingMore ? (
                      <span className="sr-only" aria-live="polite">
                        Loading another page of auctions.
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </>
            )}
          </section>
        </>
      )}
    </main>
  );
}
