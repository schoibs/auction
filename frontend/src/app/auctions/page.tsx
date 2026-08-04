import { Suspense } from 'react';
import { AuctionMarketplace } from '../../components/auction-card/auction-marketplace';
import { LoadingState } from '../../components/loading-state/loading-state';

export default function AuctionsPage() {
  return (
    <Suspense
      fallback={
        <main className="page-shell" id="main-content" tabIndex={-1}>
          <LoadingState label="Loading marketplace…" cardCount={4} />
        </main>
      }
    >
      <AuctionMarketplace />
    </Suspense>
  );
}
