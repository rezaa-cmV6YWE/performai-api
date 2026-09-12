import { describe, expect, it } from 'bun:test';

import { ParseError } from '@/lib/errors';
import { parseActiveCollection, parseProfile } from '@/lib/games/maimai/parser/profile';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FULL_PROFILE_HTML = `
  <div class="see_through_block">
    <div class="name_block">PlayerOne</div>
    <div class="rating_block">15234</div>
    <img class="w_112" src="/img/icon/icon_1.png" />
    <div class="trophy_block trophy_Rainbow">Master of Maimai</div>
    <div class="p_l_10 f_l f_14">×42</div>
    <div class="t_r f_12">play count of current version: 150 maimaiDX total play count: 1,234</div>
    <div class="h_35 f_l"><img src="/img/course/1.png" /></div>
    <div class="h_35 f_l"><img src="/img/class/1.png" /></div>
  </div>
`;

// ---------------------------------------------------------------------------
// parseProfile
// ---------------------------------------------------------------------------

describe('parseProfile — happy path', () => {
  it('parses player name', () => {
    const profile = parseProfile(FULL_PROFILE_HTML, 'intl');
    expect(profile.name).toBe('PlayerOne');
  });

  it('parses numeric rating', () => {
    const profile = parseProfile(FULL_PROFILE_HTML, 'intl');
    expect(profile.rating.value).toBe(15234);
  });

  it('parses title text and rainbow type', () => {
    const profile = parseProfile(FULL_PROFILE_HTML, 'intl');
    expect(profile.title.value).toBe('Master of Maimai');
    expect(profile.title.type).toBe('rainbow');
  });

  it('parses star count', () => {
    expect(parseProfile(FULL_PROFILE_HTML, 'intl').stars).toBe(42);
  });

  it('parses version and total play counts (with comma-formatted numbers)', () => {
    const { versionPlayCount, totalPlayCount } = parseProfile(FULL_PROFILE_HTML, 'intl').playCount;
    expect(versionPlayCount).toBe(150);
    expect(totalPlayCount).toBe(1234);
  });

  it('resolves icon URL relative to the intl server origin', () => {
    const profile = parseProfile(FULL_PROFILE_HTML, 'intl');
    expect(profile.icon).toBe('https://maimaidx-eng.com/img/icon/icon_1.png');
  });
});

const makeTitleVariantHtml = (trophyClass: string) => `
    <div class="see_through_block">
      <div class="name_block">P</div>
      <div class="rating_block">0</div>
      <div class="trophy_block ${trophyClass}">Title</div>
      <div class="p_l_10 f_l f_14">×0</div>
      <div class="t_r f_12"></div>
    </div>
  `;

describe('parseProfile — title type variants', () => {
  it('parses gold title', () => {
    expect(parseProfile(makeTitleVariantHtml('trophy_Gold'), 'intl').title.type).toBe('gold');
  });

  it('parses silver title', () => {
    expect(parseProfile(makeTitleVariantHtml('trophy_Silver'), 'intl').title.type).toBe('silver');
  });

  it('parses bronze title', () => {
    expect(parseProfile(makeTitleVariantHtml('trophy_Bronze'), 'intl').title.type).toBe('bronze');
  });

  it('parses normal title', () => {
    expect(parseProfile(makeTitleVariantHtml('trophy_Normal'), 'intl').title.type).toBe('normal');
  });

  it('returns null type for unrecognized trophy class', () => {
    expect(parseProfile(makeTitleVariantHtml('trophy_Unknown'), 'intl').title.type).toBeNull();
  });
});

describe('parseProfile — error cases', () => {
  it('throws ParseError when .see_through_block is missing', () => {
    expect(() => parseProfile('<div>no block</div>', 'intl')).toThrow(ParseError);
  });

  it('throws ParseError when .name_block is missing', () => {
    const html = `
      <div class="see_through_block">
        <div class="rating_block">100</div>
        <div class="t_r f_12"></div>
      </div>
    `;
    expect(() => parseProfile(html, 'intl')).toThrow(ParseError);
  });

  it('throws ParseError when .rating_block is missing', () => {
    const html = `
      <div class="see_through_block">
        <div class="name_block">P</div>
        <div class="t_r f_12"></div>
      </div>
    `;
    expect(() => parseProfile(html, 'intl')).toThrow(ParseError);
  });

  it('throws ParseError when rating is not a valid number', () => {
    const html = `
      <div class="see_through_block">
        <div class="name_block">P</div>
        <div class="rating_block">N/A</div>
        <div class="t_r f_12"></div>
      </div>
    `;
    expect(() => parseProfile(html, 'intl')).toThrow(ParseError);
  });
});

describe('parseProfile — jp server', () => {
  it('resolves icon URL relative to the jp server origin', () => {
    const html = `
      <div class="see_through_block">
        <div class="name_block">P</div>
        <div class="rating_block">0</div>
        <img class="w_112" src="/img/icon/icon_1.png" />
        <div class="t_r f_12"></div>
      </div>
    `;
    const profile = parseProfile(html, 'jp');
    expect(profile.icon).toBe('https://maimaidx.jp/img/icon/icon_1.png');
  });
});

// ---------------------------------------------------------------------------
// parseActiveCollection
// ---------------------------------------------------------------------------

describe('parseActiveCollection', () => {
  it('returns the resolved absolute URL of the active nameplate', () => {
    const html = `
      <div class="town_block m_15 p_15 t_l">
        <img class="w_396 m_r_10" src="/img/nameplate/plate_1.png" />
      </div>
    `;
    expect(parseActiveCollection(html, 'intl')).toBe(
      'https://maimaidx-eng.com/img/nameplate/plate_1.png'
    );
  });

  it('returns the resolved URL for the jp server', () => {
    const html = `
      <div class="town_block m_15 p_15 t_l">
        <img class="w_396 m_r_10" src="/img/nameplate/plate_2.png" />
      </div>
    `;
    expect(parseActiveCollection(html, 'jp')).toBe('https://maimaidx.jp/img/nameplate/plate_2.png');
  });

  it('throws ParseError when town_block container is missing', () => {
    expect(() => parseActiveCollection('<div>no block</div>', 'intl')).toThrow(ParseError);
  });

  it('throws ParseError when the active collection image is missing', () => {
    const html = `<div class="town_block m_15 p_15 t_l"></div>`;
    expect(() => parseActiveCollection(html, 'intl')).toThrow(ParseError);
  });
});
