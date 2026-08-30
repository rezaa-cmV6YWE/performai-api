import {
  getFcImageUrl,
  getFsImageUrl,
  getIconUrl,
  getJacketUrl,
  getRatingBadgeUrl,
} from '@/lib/games/maimai/assets';

import { describe, expect, it } from 'bun:test';

// ---------------------------------------------------------------------------
// getJacketUrl
// ---------------------------------------------------------------------------

describe('getJacketUrl', () => {
  it('builds a full URL for a jacket filename', () => {
    expect(getJacketUrl('garakuta.png')).toBe(
      'https://maimaidx-eng.com/maimai-mobile/img/Music/garakuta.png'
    );
  });

  it('returns null for undefined', () => {
    expect(getJacketUrl(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(getJacketUrl('')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getIconUrl
// ---------------------------------------------------------------------------

describe('getIconUrl', () => {
  it('builds a full icon URL', () => {
    expect(getIconUrl('fc')).toBe('https://maimaidx-eng.com/maimai-mobile/img/music_icon_fc.png');
  });

  it('returns null for undefined', () => {
    expect(getIconUrl(undefined)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getFcImageUrl
// ---------------------------------------------------------------------------

describe('getFcImageUrl', () => {
  it('returns ap+ URL', () => {
    expect(getFcImageUrl('ap+')).toContain('music_icon_app.png');
  });

  it('returns ap URL', () => {
    expect(getFcImageUrl('ap')).toContain('music_icon_ap.png');
  });

  it('returns fc+ URL', () => {
    expect(getFcImageUrl('fc+')).toContain('music_icon_fcp.png');
  });

  it('returns fc URL', () => {
    expect(getFcImageUrl('fc')).toContain('music_icon_fc.png');
  });

  it('returns null for "none"', () => {
    expect(getFcImageUrl('none')).toBeNull();
  });

  it('returns null for unknown fc value', () => {
    expect(getFcImageUrl('unknown')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getFsImageUrl
// ---------------------------------------------------------------------------

describe('getFsImageUrl', () => {
  it('returns fdx+ URL', () => {
    expect(getFsImageUrl('fdx+')).toContain('music_icon_fsdp.png');
  });

  it('returns fdx URL', () => {
    expect(getFsImageUrl('fdx')).toContain('music_icon_fsd.png');
  });

  it('returns fs+ URL', () => {
    expect(getFsImageUrl('fs+')).toContain('music_icon_fsp.png');
  });

  it('returns fs URL', () => {
    expect(getFsImageUrl('fs')).toContain('music_icon_fs.png');
  });

  it('returns sync URL', () => {
    expect(getFsImageUrl('sync')).toContain('music_icon_sync.png');
  });

  it('returns null for "none"', () => {
    expect(getFsImageUrl('none')).toBeNull();
  });

  it('returns null for unknown fs value', () => {
    expect(getFsImageUrl('unknown')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getRatingBadgeUrl
// ---------------------------------------------------------------------------

describe('getRatingBadgeUrl', () => {
  it('returns kiwami badge for rating >= 16000 on version >= 26 (CiRCLE PLUS)', () => {
    expect(getRatingBadgeUrl(16200, 26)).toContain('rating_kiwami.png');
    expect(getRatingBadgeUrl(16000, 26)).toContain('rating_kiwami.png');
  });

  it('does NOT return kiwami for versions < 26', () => {
    // 16200 on version 25 → falls through to rainbow (>=15000)
    expect(getRatingBadgeUrl(16200, 25)).toContain('rating_rainbow.png');
    expect(getRatingBadgeUrl(16200, 20)).toContain('rating_rainbow.png');
  });

  it('returns rainbow for rating >= 15000', () => {
    expect(getRatingBadgeUrl(15200, 26)).toContain('rating_rainbow.png');
    expect(getRatingBadgeUrl(15000, 26)).toContain('rating_rainbow.png');
  });

  it('returns platinum for rating >= 14500', () => {
    expect(getRatingBadgeUrl(14600, 26)).toContain('rating_platinum.png');
    expect(getRatingBadgeUrl(14500, 26)).toContain('rating_platinum.png');
  });

  it('returns gold for rating >= 14000', () => {
    expect(getRatingBadgeUrl(14100, 26)).toContain('rating_gold.png');
    expect(getRatingBadgeUrl(14000, 26)).toContain('rating_gold.png');
  });

  it('returns silver for rating >= 13000', () => {
    expect(getRatingBadgeUrl(13100, 26)).toContain('rating_silver.png');
    expect(getRatingBadgeUrl(13000, 26)).toContain('rating_silver.png');
  });

  it('returns bronze for rating >= 12000', () => {
    expect(getRatingBadgeUrl(12100, 26)).toContain('rating_bronze.png');
    expect(getRatingBadgeUrl(12000, 26)).toContain('rating_bronze.png');
  });

  it('returns purple for rating >= 10000', () => {
    expect(getRatingBadgeUrl(10500, 26)).toContain('rating_purple.png');
    expect(getRatingBadgeUrl(10000, 26)).toContain('rating_purple.png');
  });

  it('returns red for rating >= 7000', () => {
    expect(getRatingBadgeUrl(7500, 26)).toContain('rating_red.png');
    expect(getRatingBadgeUrl(7000, 26)).toContain('rating_red.png');
  });

  it('returns orange for rating >= 4000', () => {
    expect(getRatingBadgeUrl(4500, 26)).toContain('rating_orange.png');
    expect(getRatingBadgeUrl(4000, 26)).toContain('rating_orange.png');
  });

  it('returns green for rating >= 2000', () => {
    expect(getRatingBadgeUrl(2500, 26)).toContain('rating_green.png');
    expect(getRatingBadgeUrl(2000, 26)).toContain('rating_green.png');
  });

  it('returns blue for rating >= 1', () => {
    expect(getRatingBadgeUrl(500, 26)).toContain('rating_blue.png');
    expect(getRatingBadgeUrl(1, 26)).toContain('rating_blue.png');
  });

  it('returns null for rating 0', () => {
    expect(getRatingBadgeUrl(0, 26)).toBeNull();
  });
});
