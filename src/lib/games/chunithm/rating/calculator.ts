export function calculateWholeRating(
  score: number,
  internalLevel: number | null | undefined
): number {
  if (!internalLevel || internalLevel <= 0) return 0;

  const il10000 = Math.round(internalLevel * 10000);

  if (score >= 1_009_000) {
    return il10000 + 21_500;
  }
  if (score >= 1_007_500) {
    return il10000 + 20_000 + (score - 1_007_500);
  }
  if (score >= 1_005_000) {
    return il10000 + 15_000 + (score - 1_005_000) * 2;
  }
  if (score >= 1_000_000) {
    return il10000 + 10_000 + (score - 1_000_000);
  }
  if (score >= 975_000) {
    return Math.floor(il10000 + ((score - 975_000) * 2) / 5);
  }
  if (score >= 900_000) {
    const effectiveIl10000 = Math.max(il10000 - 50_000, 0);
    return Math.floor(
      effectiveIl10000 + ((score - 900_000) / 75_000) * (il10000 - effectiveIl10000)
    );
  }
  if (score >= 800_000) {
    const effectiveIl10000 = Math.max(il10000 - 50_000, 0);
    return Math.floor(
      effectiveIl10000 / 2 + ((score - 800_000) / 100_000) * (effectiveIl10000 / 2)
    );
  }
  if (score >= 500_000) {
    const effectiveIl10000 = Math.max(il10000 - 50_000, 0);
    return Math.floor(((score - 500_000) / 300_000) * (effectiveIl10000 / 2));
  }

  return 0;
}

export function calculateSongRating(
  score: number,
  internalLevel: number | null | undefined
): number {
  const whole = calculateWholeRating(score, internalLevel);
  return Math.floor(whole / 100) / 100;
}

export function computeTotalRating(
  oldRatingScores: readonly number[],
  newRatingScores: readonly number[]
): number {
  const sum = [...oldRatingScores, ...newRatingScores].reduce((acc, r) => acc + r, 0);
  return Math.floor((sum / 50) * 100) / 100;
}
