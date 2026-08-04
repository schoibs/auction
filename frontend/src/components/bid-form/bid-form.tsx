'use client';

import Link from 'next/link';
import { type FormEvent, useState } from 'react';
import { useAuth } from '../../contexts/auth-context';
import { apiFetch } from '../../lib/api-client';
import { ApiError, getErrorMessages } from '../../lib/api-error';
import { formatCredits } from '../../lib/format';
import type { AuctionDetail, Bid } from '../../types/api';
import styles from './bid-form.module.css';

interface BidFormProps {
  auction: AuctionDetail;
  isEnding: boolean;
  onAuctionChanged(): Promise<void>;
}

export function BidForm({
  auction,
  isEnding,
  onAuctionChanged,
}: BidFormProps) {
  const { handleUnauthorized, status, token, user } = useAuth();
  const [amount, setAmount] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  const minimumBid = auction.currentHighestBid
    ? auction.currentHighestBid.amount + 1
    : Math.max(1, auction.startPrice);

  if (auction.status !== 'ACTIVE') {
    return (
      <div className={styles.unavailable}>
        This auction is {auction.status.toLowerCase()} and no longer accepts
        bids.
      </div>
    );
  }

  if (isEnding) {
    return (
      <div className={styles.unavailable} aria-live="polite">
        Auction is ending. Bidding has been disabled while the final result is
        confirmed.
      </div>
    );
  }

  if (status === 'loading') {
    return <div className={styles.unavailable}>Checking your session…</div>;
  }

  if (status === 'anonymous' || !token || !user) {
    const nextPath = `/auctions/${auction.id}`;

    return (
      <div className={styles.unavailable}>
        {sessionExpired ? <p>Your session expired.</p> : null}
        <Link href={`/login?next=${encodeURIComponent(nextPath)}`}>
          Log in to bid
        </Link>
      </div>
    );
  }

  if (auction.sellerUserId === user.id) {
    return (
      <div className={styles.unavailable}>
        You cannot bid on your own auction.
      </div>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setFieldError(null);
    setFormErrors([]);
    setConfirmation(null);

    if (!amount.trim()) {
      setFieldError('Enter a bid amount.');
      return;
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || !Number.isInteger(numericAmount)) {
      setFieldError('Bid amount must be a whole number.');
      return;
    }

    if (numericAmount < minimumBid) {
      setFieldError(`Bid must be at least ${formatCredits(minimumBid)}.`);
      return;
    }

    setIsSubmitting(true);

    try {
      await apiFetch<Bid>(`/auctions/${auction.id}/bids`, {
        method: 'POST',
        body: { amount: numericAmount },
        token,
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        handleUnauthorized(error);
        setSessionExpired(true);
        setFormErrors(['Your session expired. Log in to place a bid.']);
      } else if (error instanceof ApiError && error.status === 400) {
        setFieldError(error.messages.join(' '));
      } else if (error instanceof ApiError && error.status === 409) {
        await onAuctionChanged();
        setFormErrors(error.messages);
      } else {
        setFormErrors(getErrorMessages(error, 'Unable to place this bid.'));
      }

      setIsSubmitting(false);
      return;
    }

    setAmount('');
    setConfirmation('Your bid was accepted.');
    await onAuctionChanged();
    setIsSubmitting(false);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.heading}>
        <h2>Place a bid</h2>
        <span>Minimum {formatCredits(minimumBid)}</span>
      </div>

      <div className={styles.controls}>
        <div className={styles.field}>
          <label htmlFor="bid-amount">Bid amount in credits</label>
          <input
            id="bid-amount"
            name="amount"
            type="number"
            inputMode="numeric"
            min={minimumBid}
            step="1"
            required
            value={amount}
            aria-invalid={Boolean(fieldError)}
            aria-describedby={
              fieldError ? 'bid-minimum bid-amount-error' : 'bid-minimum'
            }
            onChange={(event) => setAmount(event.target.value)}
          />
          <span id="bid-minimum" className={styles.hint}>
            Enter a whole number of at least {formatCredits(minimumBid)}.
          </span>
          {fieldError ? (
            <p id="bid-amount-error" className={styles.error}>
              {fieldError}
            </p>
          ) : null}
        </div>

        <button
          className="primary-button"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Placing bid…' : 'Place bid'}
        </button>
      </div>

      {formErrors.length > 0 ? (
        <div className={styles.formError} role="alert">
          {formErrors.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      ) : null}

      {confirmation ? (
        <p className={styles.confirmation} aria-live="polite">
          {confirmation}
        </p>
      ) : null}
    </form>
  );
}
