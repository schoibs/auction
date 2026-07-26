import type { CSSProperties } from 'react';
import type { CardType } from '../../types/api';
import { CardStats } from '../card-stats/card-stats';
import styles from './card-face.module.css';

function hueForName(name: string): number {
  return Array.from(name).reduce(
    (hash, character) => (hash * 31 + character.charCodeAt(0)) % 360,
    0,
  );
}

function initialsForName(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2);

  return initials || '?';
}

export function CardFace({ cardType }: { cardType: CardType }) {
  const style = {
    '--card-hue': hueForName(cardType.name),
  } as CSSProperties;

  return (
    <div className={styles.card} style={style}>
      <div className={styles.frame}>
        <p className={styles.typeLabel}>Virtual trading card</p>
        <div className={styles.monogram} aria-hidden="true">
          {initialsForName(cardType.name)}
        </div>
        <p className={styles.name}>{cardType.name}</p>
        <CardStats cardType={cardType} />
      </div>
    </div>
  );
}
