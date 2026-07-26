'use client';

import { useEffect, useRef, useState } from 'react';
import { InventoryCard } from '../../components/inventory-card/inventory-card';
import { EmptyState } from '../../components/empty-state/empty-state';
import { ErrorState } from '../../components/error-state/error-state';
import { LoadingState } from '../../components/loading-state/loading-state';
import { SellCardForm } from '../../components/sell-card-form/sell-card-form';
import { useAuth } from '../../contexts/auth-context';
import { useProtectedPage } from '../../hooks/use-protected-page';
import { apiFetch } from '../../lib/api-client';
import { getErrorMessages } from '../../lib/api-error';
import type { Card, CardStatus, CursorPage } from '../../types/api';
import styles from './my-cards.module.css';

const PAGE_SIZE = 20;

type InventoryFilter = 'ALL' | CardStatus;

const FILTER_LABELS: Record<InventoryFilter, string> = {
  ALL: 'All',
  OWNED: 'Owned',
  LOCKED_IN_AUCTION: 'In Auction',
};

function inventoryPath(filter: InventoryFilter, cursor?: string): string {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE) });

  if (filter !== 'ALL') {
    params.set('status', filter);
  }

  if (cursor) {
    params.set('cursor', cursor);
  }

  return `/cards/mine?${params.toString()}`;
}

export default function MyCardsPage() {
  const protectedPage = useProtectedPage();
  const { handleUnauthorized, token } = useAuth();
  const [filter, setFilter] = useState<InventoryFilter>('ALL');
  const [cards, setCards] = useState<Card[] | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [listError, setListError] = useState<string[] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string[] | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const inventoryKey = `${filter}:${refreshKey}`;
  const inventoryKeyRef = useRef(inventoryKey);
  inventoryKeyRef.current = inventoryKey;

  useEffect(() => {
    if (!protectedPage.isReady || !token) {
      return;
    }

    const controller = new AbortController();

    setCards(null);
    setNextCursor(null);
    setListError(null);
    setIsLoadingMore(false);
    setLoadMoreError(null);

    void apiFetch<CursorPage<Card>>(inventoryPath(filter), {
      token,
      signal: controller.signal,
    })
      .then((page) => {
        setCards(page.items);
        setNextCursor(page.nextCursor);
        setSelectedCard((current) =>
          current
            ? (page.items.find((card) => card.id === current.id) ?? current)
            : null,
        );
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || handleUnauthorized(error)) {
          return;
        }

        setListError(getErrorMessages(error, 'Unable to load your cards.'));
      });

    return () => controller.abort();
  }, [filter, handleUnauthorized, protectedPage.isReady, refreshKey, token]);

  function changeFilter(nextFilter: InventoryFilter) {
    setSelectedCard(null);
    setFilter(nextFilter);
  }

  function refreshInventory() {
    setRefreshKey((key) => key + 1);
  }

  async function loadMore() {
    if (!token || !nextCursor || isLoadingMore) {
      return;
    }

    const requestInventoryKey = inventoryKey;
    setIsLoadingMore(true);
    setLoadMoreError(null);

    try {
      const page = await apiFetch<CursorPage<Card>>(
        inventoryPath(filter, nextCursor),
        { token },
      );

      if (inventoryKeyRef.current !== requestInventoryKey) {
        return;
      }

      setCards((current) => {
        const existingIds = new Set(current?.map((card) => card.id));
        const uniqueItems = page.items.filter(
          (card) => !existingIds.has(card.id),
        );

        return [...(current ?? []), ...uniqueItems];
      });
      setNextCursor(page.nextCursor);
    } catch (error) {
      if (
        inventoryKeyRef.current !== requestInventoryKey ||
        handleUnauthorized(error)
      ) {
        return;
      }

      setLoadMoreError(
        getErrorMessages(error, 'Unable to load more cards.'),
      );
    } finally {
      if (inventoryKeyRef.current === requestInventoryKey) {
        setIsLoadingMore(false);
      }
    }
  }

  if (protectedPage.isLoading || protectedPage.isRedirecting) {
    return (
      <main className="page-shell" id="main-content">
        <section className="state-panel" aria-live="polite">
          <p>
            {protectedPage.isLoading
              ? 'Checking your session…'
              : 'Redirecting to login…'}
          </p>
        </section>
      </main>
    );
  }

  if (protectedPage.sessionVerificationError) {
    return (
      <main className="page-shell" id="main-content">
        <section className="state-panel" aria-labelledby="session-error-title">
          <p className="eyebrow">Connection issue</p>
          <h1 id="session-error-title">Session could not be verified</h1>
          <p>{protectedPage.sessionVerificationError}</p>
          <button
            className="primary-button"
            type="button"
            disabled={protectedPage.isRetrying}
            onClick={() => void protectedPage.retryVerification()}
          >
            {protectedPage.isRetrying ? 'Retrying…' : 'Retry'}
          </button>
        </section>
      </main>
    );
  }

  if (!protectedPage.isReady || !protectedPage.user || !token) {
    return null;
  }

  return (
    <main className="page-shell" id="main-content">
      <header className={styles.pageHeader}>
        <div>
          <p className="eyebrow">
            {protectedPage.user.username}&apos;s collection
          </p>
          <h1>My Cards</h1>
          <p>Choose an owned card to list it in the marketplace.</p>
        </div>
      </header>

      <section className={styles.filters} aria-label="Inventory filters">
        <div className={styles.statusGroup} aria-label="Card status">
          {(Object.keys(FILTER_LABELS) as InventoryFilter[]).map((value) => (
            <button
              className={filter === value ? styles.activeTab : styles.tab}
              type="button"
              aria-pressed={filter === value}
              disabled={cards === null && listError === null}
              key={value}
              onClick={() => changeFilter(value)}
            >
              {FILTER_LABELS[value]}
            </button>
          ))}
        </div>

        <button
          className={styles.refresh}
          type="button"
          disabled={cards === null && listError === null}
          onClick={refreshInventory}
        >
          Refresh
        </button>
      </section>

      {selectedCard ? (
        <SellCardForm
          card={selectedCard}
          key={selectedCard.id}
          onCancel={() => setSelectedCard(null)}
          onInventoryChanged={refreshInventory}
        />
      ) : null}

      <section className={styles.results} aria-labelledby="inventory-title">
        <div className={styles.resultsHeading}>
          <h2 id="inventory-title">{FILTER_LABELS[filter]} cards</h2>
        </div>

        {cards === null ? (
          listError ? (
            <ErrorState
              title="Unable to load your cards"
              messages={listError}
              onRetry={refreshInventory}
            />
          ) : (
            <LoadingState label="Loading your cards…" cardCount={4} />
          )
        ) : cards.length === 0 ? (
          <EmptyState
            title={`No ${FILTER_LABELS[filter].toLowerCase()} cards`}
            message={
              filter === 'ALL'
                ? 'Your collection is empty.'
                : 'Try another status filter.'
            }
          />
        ) : (
          <>
            <div className={styles.grid}>
              {cards.map((card) => (
                <InventoryCard
                  card={card}
                  key={card.id}
                  onCreateAuction={setSelectedCard}
                />
              ))}
            </div>

            {loadMoreError ? (
              <div className={styles.incrementalError}>
                <ErrorState
                  title="Could not load more cards"
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
                    Loading another page of cards.
                  </span>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}
