import { describe, expect, it } from 'bun:test';

import {
  type ChunithmOtogeDb,
  findChunithmChart,
  parseInternalLevel,
} from '@/lib/games/chunithm/songs/otoge-db';

describe('Chunithm OtogeDB', () => {
  describe('parseInternalLevel', () => {
    it('prefers explicit internal level string', () => {
      expect(parseInternalLevel('14.3', '14')).toBe(14.3);
      expect(parseInternalLevel('12.6', '12+')).toBe(12.6);
    });

    it('falls back to numeric display level when internal is empty', () => {
      expect(parseInternalLevel('', '9')).toBe(9);
      expect(parseInternalLevel(undefined, '10')).toBe(10);
    });

    it('falls back to base + 0.7 when display ends with +', () => {
      expect(parseInternalLevel('', '12+')).toBe(12.7);
      expect(parseInternalLevel(undefined, '14+')).toBe(14.7);
    });

    it('returns null when neither is valid', () => {
      expect(parseInternalLevel('', '')).toBeNull();
      expect(parseInternalLevel(undefined, undefined)).toBeNull();
      expect(parseInternalLevel('abc', 'def')).toBeNull();
    });
  });

  describe('findChunithmChart', () => {
    const mockDb: ChunithmOtogeDb = {
      byId: new Map([
        [
          '428',
          {
            id: '428',
            title: 'Aleph-0',
            charts: {
              expert: {
                title: 'Aleph-0',
                level: '12',
                internalLevel: 12.0,
                imageUrl: 'https://chunithm-net-eng.com/mobile/img/aleph.jpg',
              },
              master: {
                title: 'Aleph-0',
                level: '13+',
                internalLevel: 13.9,
                imageUrl: 'https://chunithm-net-eng.com/mobile/img/aleph.jpg',
              },
            },
          },
        ],
      ]),
    };

    it('finds existing chart by id and difficulty', () => {
      const chart = findChunithmChart(mockDb, '428', 'expert');
      expect(chart).toBeDefined();
      expect(chart?.level).toBe('12');
      expect(chart?.internalLevel).toBe(12.0);
    });

    it('returns undefined when song id or difficulty is missing', () => {
      expect(findChunithmChart(mockDb, '9999', 'master')).toBeUndefined();
      expect(findChunithmChart(mockDb, '428', 'basic')).toBeUndefined();
    });
  });
});
