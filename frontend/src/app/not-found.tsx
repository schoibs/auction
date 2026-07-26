import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="page-shell" id="main-content">
      <section className="hero" aria-labelledby="not-found-title">
        <p className="eyebrow">404</p>
        <h1 id="not-found-title">Page not found</h1>
        <p>
          <Link href="/auctions">Return to the auction marketplace</Link>
        </p>
      </section>
    </main>
  );
}

