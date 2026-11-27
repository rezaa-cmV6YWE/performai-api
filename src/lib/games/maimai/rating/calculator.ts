import {
  MAIMAI_AP_BONUS_MIN_VERSION,
  MAIMAI_TWO_VERSION_NEW_THRESHOLD,
} from '@/lib/games/maimai/consts';
import type { ScoreData } from '@/lib/games/maimai/parser/scores';

export interface RatedScore extends ScoreData {
  internalLevel: number;
  addedVersion: number;
  rating: number;
  jacket: string | null;
}

// Some rank thresholds have a border factor at exactly 0.0001% below them (e.g. 100.4999).
export function getRatingFactor(accuracy: number): number {
  if (accuracy >= 100.5) return 0.224;
  if (accuracy >= 100.4999) return 0.222;
  if (accuracy >= 100.0) return 0.216;
  if (accuracy >= 99.9999) return 0.214;
  if (accuracy >= 99.5) return 0.211;
  if (accuracy >= 99.0) return 0.208;
  if (accuracy >= 98.9999) return 0.206;
  if (accuracy >= 98.0) return 0.203;
  if (accuracy >= 97.0) return 0.2;
  if (accuracy >= 96.9999) return 0.176;
  if (accuracy >= 94.0) return 0.168;
  if (accuracy >= 90.0) return 0.152;
  if (accuracy >= 80.0) return 0.136;
  if (accuracy >= 79.9999) return 0.128;
  if (accuracy >= 75.0) return 0.12;
  if (accuracy >= 70.0) return 0.112;
  if (accuracy >= 60.0) return 0.096;
  if (accuracy >= 50.0) return 0.08;
  if (accuracy >= 40.0) return 0.064;
  if (accuracy >= 30.0) return 0.048;
  if (accuracy >= 20.0) return 0.032;
  if (accuracy >= 10.0) return 0.016;
  return 0;
}

export function calculateSongRating(
  achievement: number,
  internalLevel: number,
  version: number,
  fc: string | null
): number {
  const accuracy = achievement / 10000;
  // Integer math: factor in thousandths, level in tenths, achievement in 1/10000 %.
  // Floating-point products like 0.12 * 77.5 * 10 land just below the integer and floor down.
  const factor = Math.round(getRatingFactor(accuracy) * 1000);
  const level = Math.round(internalLevel * 10);
  const base = Math.floor((factor * Math.min(achievement, 1_005_000) * level) / 100_000_000);
  const apBonus = version >= MAIMAI_AP_BONUS_MIN_VERSION && (fc === 'ap' || fc === 'ap+') ? 1 : 0;

  return base + apBonus;
}

export function computeRatingSongs(ratedScores: RatedScore[], currentVersion: number) {
  const sorted = ratedScores.toSorted((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    return b.achievement - a.achievement;
  });

  const versionThreshold =
    currentVersion >= MAIMAI_TWO_VERSION_NEW_THRESHOLD ? currentVersion - 1 : currentVersion;

  const newRatingSongs = sorted
    .filter((score) => score.addedVersion >= versionThreshold)
    .slice(0, 15);
  const oldRatingSongs = sorted
    .filter((score) => score.addedVersion < versionThreshold)
    .slice(0, 35);

  const rating = [...newRatingSongs, ...oldRatingSongs].reduce((sum, song) => sum + song.rating, 0);

  return { newRatingSongs, oldRatingSongs, rating };
}
