'use client';

import Link from 'next/link';
import { useAuth } from '../../contexts/auth-context';
import styles from './app-header.module.css';

export function AppHeader() {
  const { logout, status, user } = useAuth();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.brand} href="/auctions">
          Auction Marketplace
        </Link>
        <nav aria-label="Primary navigation">
          <ul className={styles.navigation}>
            <li>
              <Link href="/auctions">Auctions</Link>
            </li>
            {status === 'loading' ? (
              <li className={styles.muted}>Checking session…</li>
            ) : status === 'authenticated' && user ? (
              <>
                <li>
                  <Link href="/my-cards">My Cards</Link>
                </li>
                <li className={styles.username} aria-label="Signed in user">
                  {user.username}
                </li>
                <li>
                  <button
                    className={styles.logoutButton}
                    type="button"
                    onClick={logout}
                  >
                    Log out
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link href="/login">Log in</Link>
                </li>
                <li>
                  <Link className={styles.registerLink} href="/register">
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
