'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/auth-context';
import { apiFetch } from '../../lib/api-client';
import { ApiError, getErrorMessages } from '../../lib/api-error';
import { publicConfig } from '../../lib/config';
import type { AuctionDetail, Card } from '../../types/api';
import styles from './sell-card-form.module.css';

interface SellCardFormProps {
  card: Card;
  onCancel(): void;
  onInventoryChanged(): void;
}

interface FieldErrors {
  startPrice?: string;
  durationSeconds?: string;
}

const DURATION_CHOICES = [
  { label: '5 minutes', value: 300 },
  { label: '1 hour', value: 3600 },
  { label: '24 hours', value: 86400 },
  { label: '7 days', value: 604800 },
];

const integerFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

export function SellCardForm({
  card,
  onCancel,
  onInventoryChanged,
}: SellCardFormProps) {
  const router = useRouter();
  const { handleUnauthorized, token } = useAuth();
  const [startPrice, setStartPrice] = useState('');
  const [durationSeconds, setDurationSeconds] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resourceUnavailable, setResourceUnavailable] = useState(false);
  const startPriceRef = useRef<HTMLInputElement>(null);
  const minDuration = publicConfig.auctionMinDurationSeconds;
  const maxDuration = publicConfig.auctionMaxDurationSeconds;
  const durationChoices = DURATION_CHOICES.filter(
    (choice) => choice.value >= minDuration && choice.value <= maxDuration,
  );
  const isUnavailable = resourceUnavailable || card.status !== 'OWNED';

  useEffect(() => {
    startPriceRef.current?.focus();
  }, []);

  function validate(): {
    startPrice: number;
    durationSeconds: number;
  } | null {
    const errors: FieldErrors = {};
    const trimmedStartPrice = startPrice.trim();
    const trimmedDuration = durationSeconds.trim();
    const numericStartPrice = Number(trimmedStartPrice);
    const numericDuration = Number(trimmedDuration);

    if (!trimmedStartPrice) {
      errors.startPrice = 'Enter a start price.';
    } else if (
      !Number.isFinite(numericStartPrice) ||
      !Number.isInteger(numericStartPrice)
    ) {
      errors.startPrice = 'Start price must be a whole number.';
    } else if (numericStartPrice < 0) {
      errors.startPrice = 'Start price cannot be negative.';
    }

    if (!trimmedDuration) {
      errors.durationSeconds = 'Enter an auction duration.';
    } else if (
      !Number.isFinite(numericDuration) ||
      !Number.isInteger(numericDuration)
    ) {
      errors.durationSeconds = 'Duration must be a whole number of seconds.';
    } else if (numericDuration < minDuration || numericDuration > maxDuration) {
      errors.durationSeconds = `Duration must be between ${integerFormatter.format(minDuration)} and ${integerFormatter.format(maxDuration)} seconds.`;
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return null;
    }

    return {
      startPrice: numericStartPrice,
      durationSeconds: numericDuration,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormErrors([]);

    const values = validate();

    if (!values || !token || isUnavailable) {
      return;
    }

    setIsSubmitting(true);

    try {
      const auction = await apiFetch<AuctionDetail>('/auctions', {
        method: 'POST',
        body: {
          cardId: card.id,
          ...values,
        },
        token,
      });

      router.push(`/auctions/${auction.id}`);
    } catch (error) {
      if (handleUnauthorized(error)) {
        setFormErrors(['Your session expired. Log in to create an auction.']);
      } else {
        setFormErrors(
          getErrorMessages(error, 'Unable to create this auction.'),
        );
      }

      if (
        error instanceof ApiError &&
        (error.status === 403 || error.status === 404 || error.status === 409)
      ) {
        setResourceUnavailable(true);
        onInventoryChanged();
      }

      setIsSubmitting(false);
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="create-auction-title">
      <div className={styles.heading}>
        <div>
          <p className="eyebrow">List {card.cardType.name}</p>
          <h2 id="create-auction-title">Create auction</h2>
        </div>
        <button className={styles.cancel} type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <fieldset disabled={isSubmitting || isUnavailable}>
          <div className={styles.fields}>
            <div className={styles.field}>
              <label htmlFor="auction-start-price">
                Start price in credits
              </label>
              <input
                id="auction-start-price"
                name="startPrice"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                required
                ref={startPriceRef}
                value={startPrice}
                aria-invalid={Boolean(fieldErrors.startPrice)}
                aria-describedby={
                  fieldErrors.startPrice
                    ? 'start-price-hint start-price-error'
                    : 'start-price-hint'
                }
                onChange={(event) => setStartPrice(event.target.value)}
              />
              <span id="start-price-hint" className={styles.hint}>
                Enter zero or a positive whole number.
              </span>
              {fieldErrors.startPrice ? (
                <p id="start-price-error" className={styles.error}>
                  {fieldErrors.startPrice}
                </p>
              ) : null}
            </div>

            <div className={styles.field}>
              <label htmlFor="auction-duration">Duration in seconds</label>
              <input
                id="auction-duration"
                name="durationSeconds"
                type="number"
                inputMode="numeric"
                min={minDuration}
                max={maxDuration}
                step="1"
                required
                value={durationSeconds}
                aria-invalid={Boolean(fieldErrors.durationSeconds)}
                aria-describedby={
                  fieldErrors.durationSeconds
                    ? 'duration-hint duration-error'
                    : 'duration-hint'
                }
                onChange={(event) => setDurationSeconds(event.target.value)}
              />
              <span id="duration-hint" className={styles.hint}>
                Between {integerFormatter.format(minDuration)} and{' '}
                {integerFormatter.format(maxDuration)} seconds.
              </span>
              {fieldErrors.durationSeconds ? (
                <p id="duration-error" className={styles.error}>
                  {fieldErrors.durationSeconds}
                </p>
              ) : null}
            </div>
          </div>

          {durationChoices.length > 0 ? (
            <div className={styles.choices} aria-label="Duration choices">
              <span>Quick choices</span>
              <div>
                {durationChoices.map((choice) => (
                  <button
                    type="button"
                    key={choice.value}
                    onClick={() => {
                      setDurationSeconds(String(choice.value));
                      setFieldErrors((current) => ({
                        ...current,
                        durationSeconds: undefined,
                      }));
                    }}
                  >
                    {choice.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <button className="primary-button" type="submit">
            {isSubmitting
              ? 'Creating auction…'
              : isUnavailable
                ? 'Card unavailable'
                : 'Create auction'}
          </button>
        </fieldset>

        {formErrors.length > 0 ? (
          <div className={styles.formError} role="alert">
            {formErrors.map((message, index) => (
              <p key={`${message}-${index}`}>{message}</p>
            ))}
            {isUnavailable ? (
              <p>Your inventory was refreshed to show the current card state.</p>
            ) : null}
          </div>
        ) : null}
      </form>
    </section>
  );
}
