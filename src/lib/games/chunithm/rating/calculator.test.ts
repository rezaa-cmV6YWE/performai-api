import { describe, expect, it } from 'bun:test';

import {
  calculateSongRating,
  calculateWholeRating,
  computeTotalRating,
} from '@/lib/games/chunithm/rating/calculator';

describe('Chunithm rating calculator', () => {
  describe('calculateSongRating', () => {
    it('returns 0 when internal level is missing or non-positive', () => {
      expect(calculateSongRating(1_009_000, null)).toBe(0);
      expect(calculateSongRating(1_009_000, undefined)).toBe(0);
      expect(calculateSongRating(1_009_000, 0)).toBe(0);
      expect(calculateSongRating(1_009_000, -1)).toBe(0);
    });

    it('calculates ratings for score >= 1,009,000 (+2.15)', () => {
      expect(calculateSongRating(1_009_000, 14.5)).toBe(16.65);
      expect(calculateSongRating(1_010_000, 14.5)).toBe(16.65);
    });

    it('calculates ratings for 1,007,500 <= score < 1,009,000', () => {
      expect(calculateSongRating(1_007_500, 14.5)).toBe(16.5);
      expect(calculateSongRating(1_008_500, 14.5)).toBe(16.6);
    });

    it('calculates ratings for 1,005,000 <= score < 1,007,500', () => {
      expect(calculateSongRating(1_005_000, 14.5)).toBe(16.0);
      expect(calculateSongRating(1_006_250, 14.5)).toBe(16.25);
    });

    it('calculates ratings for 1,000,000 <= score < 1,005,000', () => {
      expect(calculateSongRating(1_000_000, 14.5)).toBe(15.5);
      expect(calculateSongRating(1_002_500, 14.5)).toBe(15.75);
    });

    it('calculates ratings for 975,000 <= score < 1,000,000', () => {
      expect(calculateSongRating(975_000, 14.5)).toBe(14.5);
      expect(calculateSongRating(987_500, 14.5)).toBe(15.0);
    });

    it('calculates ratings for scores below 975,000', () => {
      expect(calculateSongRating(900_000, 14.5)).toBe(9.5);
      expect(calculateSongRating(800_000, 14.5)).toBe(4.75);
      expect(calculateSongRating(500_000, 14.5)).toBe(0);
      expect(calculateSongRating(499_999, 14.5)).toBe(0);
    });
  });

  describe('calculateWholeRating', () => {
    it('returns raw scaled integer rating', () => {
      expect(calculateWholeRating(1_009_000, 14.5)).toBe(166_500);
      expect(calculateWholeRating(1_000_000, 14.5)).toBe(155_000);
    });
  });

  describe('computeTotalRating', () => {
    it('computes average across 50 slots (old 30 + new 20) floored to 2 decimal places', () => {
      const best30 = Array(30).fill(16.0);
      const new20 = Array(20).fill(15.5);
      // (30 * 16.0 + 20 * 15.5) / 50 = 790 / 50 = 15.80
      expect(computeTotalRating(best30, new20)).toBe(15.8);
    });

    it('handles empty lists', () => {
      expect(computeTotalRating([], [])).toBe(0);
    });
  });
});
