import { describe, expect, it } from 'bun:test';

import { VERSION_MAJOR_MAP } from '@/lib/games/maimai/consts';
import {
  detectCurrentVersion,
  findChart,
  getChartKey,
  getImageKey,
  type OtogeDbSongs,
  versionCodeToId,
} from '@/lib/games/maimai/songs/otoge-db';

// ---------------------------------------------------------------------------
// VERSION_MAJOR_MAP invariants
// ---------------------------------------------------------------------------

describe('VERSION_MAJOR_MAP', () => {
  it('contains only non-negative integers', () => {
    for (const id of Object.values(VERSION_MAJOR_MAP)) {
      expect(typeof id).toBe('number');
      expect(Number.isInteger(id)).toBe(true);
      expect(id).toBeGreaterThanOrEqual(0);
    }
  });
});

// ---------------------------------------------------------------------------
// versionCodeToId
// ---------------------------------------------------------------------------

describe('versionCodeToId', () => {
  it('converts classic version codes', () => {
    expect(versionCodeToId('10000')).toBe(0); // maimai
    expect(versionCodeToId('11000')).toBe(1); // maimai PLUS
    expect(versionCodeToId('12000')).toBe(2); // GreeN
    expect(versionCodeToId('19900')).toBe(12); // FiNALE
  });

  it('converts DX version codes', () => {
    expect(versionCodeToId('20000')).toBe(13); // DX
    expect(versionCodeToId('24000')).toBe(21); // BUDDiES
    expect(versionCodeToId('24500')).toBe(22); // BUDDiES PLUS
    expect(versionCodeToId('25000')).toBe(23); // PRiSM
    expect(versionCodeToId('25500')).toBe(24); // PRiSM PLUS
    expect(versionCodeToId('26000')).toBe(25); // CiRCLE
    expect(versionCodeToId('26500')).toBe(26); // CiRCLE PLUS
  });

  it('extrapolates beyond the last known version', () => {
    expect(versionCodeToId('27000')).toBe(27);
  });

  it('returns 0 for invalid codes', () => {
    expect(versionCodeToId('')).toBe(0);
    expect(versionCodeToId('abc')).toBe(0);
  });

  it('returns 0 for a code that has fewer than 3 characters', () => {
    expect(versionCodeToId('10')).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getChartKey
// ---------------------------------------------------------------------------

describe('getChartKey', () => {
  it('normalises the name and joins with type and difficulty', () => {
    expect(getChartKey('Test Song', 'dx', 'master')).toBe('test song@dx@master');
    expect(getChartKey('  Ｔｅｓｔ  ', 'std', 'basic')).toBe('test@std@basic');
  });
});

// ---------------------------------------------------------------------------
// getImageKey
// ---------------------------------------------------------------------------

describe('getImageKey', () => {
  it('extracts basename and joins with type and difficulty', () => {
    expect(getImageKey('https://example.com/img/abc.png', 'std', 'expert')).toBe(
      'abc.png@std@expert'
    );
  });

  it('returns undefined when url is undefined', () => {
    expect(getImageKey(undefined, 'std', 'basic')).toBeUndefined();
  });

  it('returns undefined when url is empty string', () => {
    expect(getImageKey('', 'dx', 'master')).toBeUndefined();
  });

  it('works with a plain filename (no slashes)', () => {
    expect(getImageKey('file.png', 'dx', 'master')).toBe('file.png@dx@master');
  });
});

// ---------------------------------------------------------------------------
// detectCurrentVersion
// ---------------------------------------------------------------------------

describe('detectCurrentVersion', () => {
  it('picks the highest version among songs released on or before today', () => {
    const rawSongs = [
      { title: 'Song 1', version: '25000', date_intl_added: '20250101' },
      { title: 'Song 2', version: '26000', date_intl_added: '20260101' },
      { title: 'Future Song', version: '27000', date_intl_added: '20991231' }, // future, ignored
    ];
    expect(detectCurrentVersion(rawSongs)).toBe(25); // 26000 → ID 25
  });

  it('falls back to MAIMAI_DEFAULT_VERSION when all songs are in the future', () => {
    const rawSongs = [{ title: 'Future', version: '27000', date_intl_added: '20991231' }];
    // MAIMAI_DEFAULT_VERSION is 26
    expect(detectCurrentVersion(rawSongs)).toBe(26);
  });

  it('ignores songs with date "000000"', () => {
    const rawSongs = [
      { title: 'Special', version: '25000', date_intl_added: '000000' },
      { title: 'Past', version: '24000', date_intl_added: '20240101' },
    ];
    expect(detectCurrentVersion(rawSongs)).toBe(21); // 24000 → ID 21
  });

  it('returns MAIMAI_DEFAULT_VERSION for an empty song list', () => {
    expect(detectCurrentVersion([])).toBe(26);
  });
});

// ---------------------------------------------------------------------------
// findChart
// ---------------------------------------------------------------------------

describe('findChart', () => {
  const db: OtogeDbSongs = {
    charts: new Map([
      [
        getChartKey('test song', 'dx', 'master'),
        { title: 'Test Song', internalLevel: 14.5, addedVersion: 25, imageUrl: 'test.png' },
      ],
    ]),
    byImage: new Map([
      [
        'test.png@dx@master',
        { title: 'Test Song', internalLevel: 14.5, addedVersion: 25, imageUrl: 'test.png' },
      ],
    ]),
    currentVersion: 26,
  };

  it('finds chart by image URL (priority)', () => {
    const chart = findChart(db, {
      songName: 'Different Name',
      imageUrl: 'https://site.com/img/test.png',
      type: 'dx',
      difficulty: 'master',
    });
    expect(chart?.internalLevel).toBe(14.5);
  });

  it('falls back to name lookup when image key yields no result', () => {
    const chart = findChart(db, {
      songName: 'Test Song',
      type: 'dx',
      difficulty: 'master',
    });
    expect(chart?.internalLevel).toBe(14.5);
  });

  it('returns undefined when neither image nor name matches', () => {
    const chart = findChart(db, {
      songName: 'No Such Song',
      type: 'dx',
      difficulty: 'master',
    });
    expect(chart).toBeUndefined();
  });

  it('returns undefined when image key does not match and name also misses', () => {
    const chart = findChart(db, {
      songName: 'Wrong Name',
      imageUrl: 'https://site.com/img/wrong.png',
      type: 'dx',
      difficulty: 'master',
    });
    expect(chart).toBeUndefined();
  });

  it('distinguishes between std and dx types', () => {
    const stdDb: OtogeDbSongs = {
      charts: new Map([
        [
          getChartKey('test song', 'std', 'expert'),
          { title: 'Test Song', internalLevel: 12.0, addedVersion: 20, imageUrl: 'test.png' },
        ],
      ]),
      byImage: new Map(),
      currentVersion: 26,
    };
    expect(
      findChart(stdDb, { songName: 'Test Song', type: 'std', difficulty: 'expert' })?.internalLevel
    ).toBe(12.0);
    expect(
      findChart(stdDb, { songName: 'Test Song', type: 'dx', difficulty: 'expert' })
    ).toBeUndefined();
  });
});
