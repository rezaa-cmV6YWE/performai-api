import { describe, expect, it } from 'bun:test';

import { parseFcFromSrc, parseFsFromSrc, parseScoreData } from '@/lib/games/maimai/parser/scores';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeScoreCard({
  difficulty = 'music_master_score_back',
  type = 'music_dx.png',
  name = 'Garakuta Doll Play',
  level = '14+',
  achievement = '100.5200%',
  dxScore = '1850 / 2000',
  fsIcon = 'music_icon_fsdp.png',
  fcIcon = 'music_icon_app.png',
  jacket = '/img/Music/garakuta.png',
}: {
  difficulty?: string;
  type?: string;
  name?: string;
  level?: string;
  achievement?: string;
  dxScore?: string;
  fsIcon?: string | null;
  fcIcon?: string | null;
  jacket?: string;
} = {}): string {
  const fsImg = fsIcon ? `<img class="h_30" src="/img/${fsIcon}" />` : '';
  const fcImg = fcIcon ? `<img class="h_30" src="/img/${fcIcon}" />` : '';

  return `
    <div>
      <div class="${difficulty}">
        <img class="music_kind_icon" src="/img/${type}" />
        <div class="music_name_block">${name}</div>
        <div class="music_lv_block">${level}</div>
        <div class="music_score_block">${achievement}</div>
        <div class="music_score_block">${dxScore}</div>
        ${fsImg}
        ${fcImg}
        <img class="music_img" src="${jacket}" />
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Difficulty routing
// ---------------------------------------------------------------------------

describe('parseScoreData — difficulty routing', () => {
  it('returns empty array for an unknown difficulty number', () => {
    expect(parseScoreData(makeScoreCard(), 99)).toEqual([]);
  });

  it('returns empty array when no cards match the expected difficulty selector', () => {
    expect(parseScoreData(makeScoreCard({ difficulty: 'music_master_score_back' }), 0)).toEqual([]);
  });

  it('parses difficulty 3 (master)', () => {
    const scores = parseScoreData(makeScoreCard(), 3);
    expect(scores.length).toBe(1);
    expect(scores[0].difficulty).toBe('master');
    expect(scores[0].difficultyNumber).toBe(3);
  });

  it('parses difficulty 0 (basic)', () => {
    const html = makeScoreCard({ difficulty: 'music_basic_score_back' });
    const scores = parseScoreData(html, 0);
    expect(scores.length).toBe(1);
    expect(scores[0].difficulty).toBe('basic');
  });

  it('parses difficulty 4 (remaster)', () => {
    const html = makeScoreCard({ difficulty: 'music_remaster_score_back' });
    const scores = parseScoreData(html, 4);
    expect(scores.length).toBe(1);
    expect(scores[0].difficulty).toBe('remaster');
  });
});

// ---------------------------------------------------------------------------
// Song type
// ---------------------------------------------------------------------------

describe('parseScoreData — song type', () => {
  it('detects dx type', () => {
    const scores = parseScoreData(makeScoreCard({ type: 'music_dx.png' }), 3);
    expect(scores[0].type).toBe('dx');
  });

  it('detects std type', () => {
    const scores = parseScoreData(makeScoreCard({ type: 'music_standard.png' }), 3);
    expect(scores[0].type).toBe('std');
  });

  it('skips card when music kind icon is unrecognised', () => {
    const scores = parseScoreData(makeScoreCard({ type: 'music_unknown.png' }), 3);
    expect(scores).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Score fields
// ---------------------------------------------------------------------------

describe('parseScoreData — score fields', () => {
  it('parses song name (normalised)', () => {
    expect(parseScoreData(makeScoreCard(), 3)[0].songName).toBe('garakuta doll play');
  });

  it('parses level string', () => {
    expect(parseScoreData(makeScoreCard(), 3)[0].level).toBe('14+');
  });

  it('converts achievement percentage to integer (×10000)', () => {
    expect(parseScoreData(makeScoreCard({ achievement: '100.5200%' }), 3)[0].achievement).toBe(
      1005200
    );
    expect(parseScoreData(makeScoreCard({ achievement: '99.0000%' }), 3)[0].achievement).toBe(
      990000
    );
  });

  it('parses dx score from "current / max" format', () => {
    expect(parseScoreData(makeScoreCard({ dxScore: '1850 / 2000' }), 3)[0].dxScore).toBe(1850);
  });

  it('sets dxScore to 0 when dx score block is missing or unparseable', () => {
    expect(parseScoreData(makeScoreCard({ dxScore: 'N/A' }), 3)[0].dxScore).toBe(0);
  });

  it('extracts jacket image basename', () => {
    expect(parseScoreData(makeScoreCard(), 3)[0].imageUrl).toBe('garakuta.png');
  });
});

// ---------------------------------------------------------------------------
// FC / FS icon parsing
// ---------------------------------------------------------------------------

describe('parseFcFromSrc', () => {
  it('parses ap+', () => {
    expect(parseFcFromSrc('music_icon_app.png')).toBe('ap+');
  });

  it('parses ap', () => {
    expect(parseFcFromSrc('music_icon_ap.png')).toBe('ap');
  });

  it('parses fc+', () => {
    expect(parseFcFromSrc('music_icon_fcp.png')).toBe('fc+');
  });

  it('parses fc', () => {
    expect(parseFcFromSrc('music_icon_fc.png')).toBe('fc');
  });

  it('returns null for an unrecognised FC icon or undefined', () => {
    expect(parseFcFromSrc('music_icon_other.png')).toBeNull();
    expect(parseFcFromSrc(undefined)).toBeNull();
  });
});

describe('parseFsFromSrc', () => {
  it('parses fdx+ from both fsdp and fdxp naming conventions', () => {
    expect(parseFsFromSrc('music_icon_fsdp.png')).toBe('fdx+');
    expect(parseFsFromSrc('music_icon_fdxp.png')).toBe('fdx+');
  });

  it('parses fdx from both fsd and fdx naming conventions', () => {
    expect(parseFsFromSrc('music_icon_fsd.png')).toBe('fdx');
    expect(parseFsFromSrc('music_icon_fdx.png')).toBe('fdx');
  });

  it('parses fs+', () => {
    expect(parseFsFromSrc('music_icon_fsp.png')).toBe('fs+');
  });

  it('parses fs', () => {
    expect(parseFsFromSrc('music_icon_fs.png')).toBe('fs');
  });

  it('parses sync', () => {
    expect(parseFsFromSrc('music_icon_sync.png')).toBe('sync');
  });

  it('returns null for an unrecognised FS icon or undefined', () => {
    expect(parseFsFromSrc('music_icon_other.png')).toBeNull();
    expect(parseFsFromSrc(undefined)).toBeNull();
  });
});

describe('parseScoreData — FC / FS combinations', () => {
  it('correctly parses card with only FDX (no FC)', () => {
    const html = makeScoreCard({
      name: 'Rodeo Machine',
      fsIcon: 'music_icon_fsd.png',
      fcIcon: null,
    });
    const scores = parseScoreData(html, 3);
    expect(scores[0].songName).toBe('rodeo machine');
    expect(scores[0].fs).toBe('fdx');
    expect(scores[0].fc).toBeNull();
  });

  it('correctly parses card with music_icon_fdx.png naming', () => {
    const html = makeScoreCard({
      name: 'Rodeo Machine',
      fsIcon: 'music_icon_fdx.png',
      fcIcon: null,
    });
    const scores = parseScoreData(html, 3);
    expect(scores[0].fs).toBe('fdx');
    expect(scores[0].fc).toBeNull();
  });

  it('correctly parses card with only FC (no FS)', () => {
    const html = makeScoreCard({
      fsIcon: null,
      fcIcon: 'music_icon_fc.png',
    });
    const scores = parseScoreData(html, 3);
    expect(scores[0].fc).toBe('fc');
    expect(scores[0].fs).toBeNull();
  });

  it('correctly parses card with neither FC nor FS', () => {
    const html = makeScoreCard({
      fsIcon: null,
      fcIcon: null,
    });
    const scores = parseScoreData(html, 3);
    expect(scores[0].fc).toBeNull();
    expect(scores[0].fs).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Unplayed card
// ---------------------------------------------------------------------------

describe('parseScoreData — unplayed cards', () => {
  it('skips a score card that has no .music_score_block (unplayed)', () => {
    const html = `
      <div>
        <div class="music_master_score_back">
          <img class="music_kind_icon" src="/img/music_dx.png" />
          <div class="music_name_block">Unplayed Song</div>
          <div class="music_lv_block">12</div>
        </div>
      </div>
    `;
    expect(parseScoreData(html, 3)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Multiple cards
// ---------------------------------------------------------------------------

describe('parseScoreData — multiple score cards', () => {
  it('parses all cards in a page with multiple entries', () => {
    const html = `
      <div>
        <div class="music_master_score_back">
          <img class="music_kind_icon" src="/img/music_dx.png" />
          <div class="music_name_block">Song A</div>
          <div class="music_lv_block">14+</div>
          <div class="music_score_block">100.0000%</div>
          <div class="music_score_block">1800 / 2000</div>
          <img class="h_30" src="/img/music_icon_fsdp.png" />
          <img class="h_30" src="/img/music_icon_fc.png" />
          <img class="music_img" src="/img/Music/song_a.png" />
        </div>
        <div class="music_master_score_back">
          <img class="music_kind_icon" src="/img/music_dx.png" />
          <div class="music_name_block">Song B</div>
          <div class="music_lv_block">13</div>
          <div class="music_score_block">99.5000%</div>
          <div class="music_score_block">1600 / 2000</div>
          <img class="h_30" src="/img/music_icon_fs.png" />
          <img class="h_30" src="/img/music_icon_app.png" />
          <img class="music_img" src="/img/Music/song_b.png" />
        </div>
      </div>
    `;
    const scores = parseScoreData(html, 3);
    expect(scores.length).toBe(2);
    expect(scores.map((s) => s.songName)).toContain('song a');
    expect(scores.map((s) => s.songName)).toContain('song b');
  });
});
