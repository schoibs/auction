'use client';

import { useEffect, useState } from 'react';
import type { IsoDateString } from '../../types/api';
import styles from './countdown.module.css';

function visibleDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) {
    return 'Ended';
  }

  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

function accessibleDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) {
    return 'Auction ended';
  }

  if (totalSeconds < 60) {
    return 'Less than one minute remaining';
  }

  const minutes = Math.ceil(totalSeconds / 60);
  return `${minutes} minute${minutes === 1 ? '' : 's'} remaining`;
}

interface CountdownProps {
  endTime: IsoDateString;
  onEnd?: () => void;
}

export function Countdown({ endTime, onEnd }: CountdownProps) {
  const [now, setNow] = useState<number | null>(null);
  const endTimestamp = new Date(endTime).getTime();

  useEffect(() => {
    setNow(Date.now());

    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!onEnd || Number.isNaN(endTimestamp)) {
      return;
    }

    const remainingMilliseconds = endTimestamp - Date.now();

    if (remainingMilliseconds <= 0) {
      onEnd();
      return;
    }

    const timeout = window.setTimeout(onEnd, remainingMilliseconds);
    return () => window.clearTimeout(timeout);
  }, [endTimestamp, onEnd]);

  if (Number.isNaN(endTimestamp)) {
    return <span>Unknown end time</span>;
  }

  if (now === null) {
    return <span className={styles.countdown}>Calculating…</span>;
  }

  const remainingSeconds = Math.max(
    0,
    Math.ceil((endTimestamp - now) / 1_000),
  );

  return (
    <time className={styles.countdown} dateTime={endTime}>
      <span aria-hidden="true">{visibleDuration(remainingSeconds)}</span>
      <span className="sr-only">{accessibleDuration(remainingSeconds)}</span>
    </time>
  );
}
