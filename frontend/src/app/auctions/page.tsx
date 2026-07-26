export default function AuctionsPage() {
  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <a className="brand" href="/auctions">
            Auction Marketplace
          </a>
        </div>
      </header>
      <main className="page-shell" id="main-content">
        <section className="hero" aria-labelledby="page-title">
          <p className="eyebrow">Marketplace</p>
          <h1 id="page-title">Auctions are coming soon.</h1>
          <p>
            The frontend foundation is ready. Public auction browsing and
            bidding will be added soon.
          </p>
        </section>
      </main>
    </>
  );
}

