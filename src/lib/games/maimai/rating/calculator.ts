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

export function getRatingFactor(accuracy: number): number {
  if (accuracy >= 100.5) return 0.224;
  if (accuracy >= 100.0) return 0.216;
  if (accuracy >= 99.5) return 0.211;
  if (accuracy >= 99.0) return 0.208;
  if (accuracy >= 98.0) return 0.203;
  if (accuracy >= 97.0) return 0.2;
  if (accuracy >= 94.0) return 0.168;
  if (accuracy >= 90.0) return 0.152;
  if (accuracy >= 80.0) return 0.136;
  if (accuracy >= 75.0) return 0.12;
  if (accuracy >= 70.0) return 0.112;
  if (accuracy >= 60.0) return 0.096;
  if (accuracy >= 50.0) return 0.08;
  return 0.05;
}

export function calculateSongRating(
  achievement: number,
  internalLevel: number,
  version: number,
  fc: string | null
): number {
  const accuracy = achievement / 10000;
  const factor = getRatingFactor(accuracy);
  const apBonus = version >= MAIMAI_AP_BONUS_MIN_VERSION && (fc === 'ap' || fc === 'ap+') ? 1 : 0;

  return Math.floor(factor * Math.min(accuracy, 100.5) * internalLevel + apBonus);
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
