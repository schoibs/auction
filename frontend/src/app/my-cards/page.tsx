'use client';

import { useProtectedPage } from '../../hooks/use-protected-page';

export default function MyCardsPage() {
  const {
    isLoading,
    isReady,
    isRedirecting,
    isRetrying,
    retryVerification,
    sessionVerificationError,
    user,
  } = useProtectedPage();

  if (isLoading || isRedirecting) {
    return (
      <main className="page-shell" id="main-content">
        <section className="state-panel" aria-live="polite">
          <p>{isLoading ? 'Checking your session…' : 'Redirecting to login…'}</p>
        </section>
      </main>
    );
  }

  if (sessionVerificationError) {
    return (
      <main className="page-shell" id="main-content">
        <section className="state-panel" aria-labelledby="session-error-title">
          <p className="eyebrow">Connection issue</p>
          <h1 id="session-error-title">Session could not be verified</h1>
          <p>{sessionVerificationError}</p>
          <button
            className="primary-button"
            type="button"
            disabled={isRetrying}
            onClick={() => void retryVerification()}
          >
            {isRetrying ? 'Retrying…' : 'Retry'}
          </button>
        </section>
      </main>
    );
  }

  if (!isReady || !user) {
    return null;
  }

  return (
    <main className="page-shell" id="main-content">
      <section className="hero" aria-labelledby="my-cards-title">
        <p className="eyebrow">{user.username}&apos;s collection</p>
        <h1 id="my-cards-title">My Cards</h1>
        <p>
          Your protected inventory is ready. Card browsing and auction creation
          features will arrive soon.
        </p>
      </section>
    </main>
  );
}
