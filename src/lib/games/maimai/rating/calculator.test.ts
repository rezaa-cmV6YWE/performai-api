import { describe, expect, it } from 'bun:test';

import {
  calculateSongRating,
  computeRatingSongs,
  getRatingFactor,
  type RatedScore,
} from '@/lib/games/maimai/rating/calculator';

// ---------------------------------------------------------------------------
// getRatingFactor
// ---------------------------------------------------------------------------

describe('getRatingFactor', () => {
  it('returns correct factors for each achievement bracket', () => {
    expect(getRatingFactor(100.5)).toBe(0.224);
    expect(getRatingFactor(101.0)).toBe(0.224); // above 100.5 uses same factor
    expect(getRatingFactor(100.0)).toBe(0.216);
    expect(getRatingFactor(99.5)).toBe(0.211);
    expect(getRatingFactor(99.0)).toBe(0.208);
    expect(getRatingFactor(98.0)).toBe(0.203);
    expect(getRatingFactor(97.0)).toBe(0.2);
    expect(getRatingFactor(94.0)).toBe(0.168);
    expect(getRatingFactor(90.0)).toBe(0.152);
    expect(getRatingFactor(80.0)).toBe(0.136);
    expect(getRatingFactor(75.0)).toBe(0.12);
    expect(getRatingFactor(70.0)).toBe(0.112);
    expect(getRatingFactor(60.0)).toBe(0.096);
    expect(getRatingFactor(50.0)).toBe(0.08);
    expect(getRatingFactor(40.0)).toBe(0.05); // below 50
    expect(getRatingFactor(0)).toBe(0.05);
  });

  it('uses the lower bracket at exact bracket boundaries (< not <=)', () => {
    // 99.5 exactly hits that branch (>= 99.5)
    expect(getRatingFactor(99.5)).toBe(0.211);
    // 99.4999 falls into the >= 99.0 bucket
    expect(getRatingFactor(99.4999)).toBe(0.208);
  });
});

// ---------------------------------------------------------------------------
// calculateSongRating
// ---------------------------------------------------------------------------

describe('calculateSongRating', () => {
  it('computes floor(factor * min(accuracy, 100.5) * internalLevel)', () => {
    // 100.5200% → accuracy 100.52, capped at 100.5; factor 0.224; level 14.5
    // 0.224 * 100.5 * 14.5 = 326.424 → floor → 326
    expect(calculateSongRating(1005200, 14.5, 26, 'fc')).toBe(326);
  });

  it('applies +1 AP bonus on version >= 25 for ap', () => {
    expect(calculateSongRating(1005000, 14.5, 25, 'ap')).toBe(327);
  });

  it('applies +1 AP bonus on version >= 25 for ap+', () => {
    expect(calculateSongRating(1005000, 14.5, 26, 'ap+')).toBe(327);
  });

  it('does NOT apply AP bonus for fc (only ap/ap+ get it)', () => {
    expect(calculateSongRating(1005000, 14.5, 26, 'fc')).toBe(326);
  });

  it('does NOT apply AP bonus on versions < 25', () => {
    expect(calculateSongRating(1005000, 14.5, 24, 'ap')).toBe(326);
    expect(calculateSongRating(1005000, 14.5, 20, 'ap+')).toBe(326);
  });

  it('caps accuracy at 100.5 even when achievement exceeds 1005000', () => {
    // achievement 1010000 → accuracy 101.0, capped at 100.5; same as 1005000 + factor
    expect(calculateSongRating(1010000, 14.5, 26, 'none')).toBe(326);
  });
});

// ---------------------------------------------------------------------------
// computeRatingSongs
// ---------------------------------------------------------------------------

function makeScore(
  overrides: Partial<RatedScore> & { songName: string; addedVersion: number; rating: number }
): RatedScore {
  return {
    type: 'dx',
    difficulty: 'master',
    difficultyNumber: 3,
    level: '14',
    achievement: 1000000,
    dxScore: 1000,
    fc: 'fc',
    fs: 'fs',
    internalLevel: 14.0,
    jacket: null,
    ...overrides,
  };
}

describe('computeRatingSongs', () => {
  it('splits new and old songs at versionThreshold and caps at 15 new / 35 old', () => {
    const scores: RatedScore[] = [];
    for (let i = 1; i <= 20; i++) {
      scores.push(makeScore({ songName: `New ${i}`, addedVersion: 25, rating: 300 + i }));
    }
    for (let i = 1; i <= 40; i++) {
      scores.push(makeScore({ songName: `Old ${i}`, addedVersion: 20, rating: 200 + i }));
    }

    const { newRatingSongs, oldRatingSongs, rating } = computeRatingSongs(scores, 26);
    expect(newRatingSongs.length).toBe(15);
    expect(oldRatingSongs.length).toBe(35);
    expect(rating).toBe(
      newRatingSongs.reduce((s, r) => s + r.rating, 0) +
        oldRatingSongs.reduce((s, r) => s + r.rating, 0)
    );
  });

  it('picks the highest-rated songs first', () => {
    const scores: RatedScore[] = [
      makeScore({ songName: 'Low', addedVersion: 25, rating: 100 }),
      makeScore({ songName: 'High', addedVersion: 25, rating: 500 }),
      makeScore({ songName: 'Mid', addedVersion: 25, rating: 300 }),
    ];
    const { newRatingSongs } = computeRatingSongs(scores, 26);
    expect(newRatingSongs[0].songName).toBe('High');
    expect(newRatingSongs[1].songName).toBe('Mid');
  });

  it('breaks rating ties by achievement (higher achievement comes first)', () => {
    const scores: RatedScore[] = [
      makeScore({ songName: 'A', addedVersion: 25, rating: 300, achievement: 990000 }),
      makeScore({ songName: 'B', addedVersion: 25, rating: 300, achievement: 1000000 }),
    ];
    const { newRatingSongs } = computeRatingSongs(scores, 26);
    expect(newRatingSongs[0].songName).toBe('B');
  });

  it('treats currentVersion < MAIMAI_TWO_VERSION_NEW_THRESHOLD as single-version window', () => {
    // With currentVersion 24 (< 25 threshold), versionThreshold == currentVersion == 24
    // So only addedVersion >= 24 counts as "new"
    const scores: RatedScore[] = [
      makeScore({ songName: 'Exactly 24', addedVersion: 24, rating: 300 }),
      makeScore({ songName: 'Older', addedVersion: 23, rating: 300 }),
    ];
    const { newRatingSongs, oldRatingSongs } = computeRatingSongs(scores, 24);
    expect(newRatingSongs.map((s) => s.songName)).toContain('Exactly 24');
    expect(oldRatingSongs.map((s) => s.songName)).toContain('Older');
  });

  it('returns empty arrays and zero rating for empty input', () => {
    const { newRatingSongs, oldRatingSongs, rating } = computeRatingSongs([], 26);
    expect(newRatingSongs).toEqual([]);
    expect(oldRatingSongs).toEqual([]);
    expect(rating).toBe(0);
  });
});
