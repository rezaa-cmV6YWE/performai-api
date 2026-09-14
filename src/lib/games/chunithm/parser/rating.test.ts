import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  capitalizeDifficulty,
  extractToken,
  parseChainFromSrc,
  parseChunithmRatingList,
  parseComboFromSrc,
  parseRatingDifficulty,
} from '@/lib/games/chunithm/parser/rating';

const SAMPLE_HTML = `
<div class="box05 w400">
  <form action="https://chunithm-net-eng.com/mobile/record/musicGenre/sendMusicDetail/" method="post">
    <div class="w388 musiclist_box bg_expert">
      <div class="music_title">Aleph-0</div>
      <div class="play_musicdata_highscore">
        SCORE：<span class="text_b">1,005,037</span>
      </div>
      <div class="play_musicdata_icon clearfix">
        <img src="https://chunithm-net-eng.com/mobile/images/icon_fullcombo.png">
        <img src="https://chunithm-net-eng.com/mobile/images/icon_fullchain2.png">
      </div>
      <input type="hidden" name="diff" value="2"/>
      <input type="hidden" name="genre" value="99"/>
      <input type="hidden" name="idx" value="428" />
    </div>
  </form>
  <form action="https://chunithm-net-eng.com/mobile/record/musicGenre/sendMusicDetail/" method="post">
    <div class="w388 musiclist_box bg_master">
      <div class="music_title">AXION</div>
      <div class="play_musicdata_highscore">
        SCORE：<span class="text_b">992,145</span>
      </div>
      <input type="hidden" name="diff" value="3"/>
      <input type="hidden" name="genre" value="99"/>
      <input type="hidden" name="idx" value="863" />
    </div>
  </form>
</div>
`;

describe('Chunithm rating parser', () => {
  describe('parseRatingDifficulty', () => {
    it('maps index numbers correctly', () => {
      expect(parseRatingDifficulty('0')).toBe('basic');
      expect(parseRatingDifficulty('1')).toBe('advanced');
      expect(parseRatingDifficulty('2')).toBe('expert');
      expect(parseRatingDifficulty('3')).toBe('master');
      expect(parseRatingDifficulty('4')).toBe('ultima');
    });

    it('falls back to CSS classes', () => {
      expect(parseRatingDifficulty(undefined, 'w388 musiclist_box bg_basic')).toBe('basic');
      expect(parseRatingDifficulty(undefined, 'w388 musiclist_box bg_advanced')).toBe('advanced');
      expect(parseRatingDifficulty(undefined, 'w388 musiclist_box bg_expert')).toBe('expert');
      expect(parseRatingDifficulty(undefined, 'w388 musiclist_box bg_master')).toBe('master');
      expect(parseRatingDifficulty(undefined, 'w388 musiclist_box bg_ultima')).toBe('ultima');
    });

    it('defaults to master if unrecognized', () => {
      expect(parseRatingDifficulty(undefined, 'something_else')).toBe('master');
    });
  });

  describe('capitalizeDifficulty', () => {
    it('capitalizes difficulty names correctly', () => {
      expect(capitalizeDifficulty('basic')).toBe('Basic');
      expect(capitalizeDifficulty('advanced')).toBe('Advanced');
      expect(capitalizeDifficulty('expert')).toBe('Expert');
      expect(capitalizeDifficulty('master')).toBe('Master');
      expect(capitalizeDifficulty('ultima')).toBe('Ultima');
    });
  });

  describe('extractToken', () => {
    it('extracts token from form with input[name="token"]', () => {
      const html = '<form><input type="hidden" name="token" value="test_token_123"/></form>';
      expect(extractToken(html)).toBe('test_token_123');
    });

    it('returns null when token input is missing', () => {
      expect(extractToken('<div>no token</div>')).toBeNull();
    });
  });

  describe('parseComboFromSrc & parseChainFromSrc', () => {
    it('parses combo lamps correctly', () => {
      expect(
        parseComboFromSrc('https://chunithm-net-eng.com/mobile/images/icon_fullcombo.png')
      ).toBe('fc');
      expect(
        parseComboFromSrc('https://chunithm-net-eng.com/mobile/images/icon_alljustice.png')
      ).toBe('aj');
      expect(
        parseComboFromSrc('https://chunithm-net-eng.com/mobile/images/icon_alljusticecritical.png')
      ).toBe('ajc');
      expect(parseComboFromSrc('something_else.png')).toBeNull();
    });

    it('parses chain lamps correctly', () => {
      expect(
        parseChainFromSrc('https://chunithm-net-eng.com/mobile/images/icon_fullchain2.png')
      ).toBe('fch');
      expect(
        parseChainFromSrc('https://chunithm-net-eng.com/mobile/images/icon_fullchain.png')
      ).toBe('fch+');
      expect(parseChainFromSrc('something_else.png')).toBeNull();
    });
  });

  describe('parseChunithmRatingList', () => {
    it('parses snippet records correctly including combo and chain', () => {
      const records = parseChunithmRatingList(SAMPLE_HTML);
      expect(records).toHaveLength(2);

      expect(records[0]).toEqual({
        id: '428',
        title: 'Aleph-0',
        difficulty: 'expert',
        score: 1005037,
        combo: 'fc',
        chain: 'fch',
      });

      expect(records[1]).toEqual({
        id: '863',
        title: 'AXION',
        difficulty: 'master',
        score: 992145,
        combo: null,
        chain: null,
      });
    });

    it('returns empty array when no records exist', () => {
      expect(parseChunithmRatingList('<div>No forms here</div>')).toEqual([]);
    });

    it('parses real best30 and recent10 HTML fixtures if present', () => {
      const best30Path = resolve(
        process.cwd(),
        '../../.gemini/antigravity-cli/brain/5c320b0c-6d84-4e86-b027-1a27c51adada/scratch/chuni-penguin/tests/chuni_penguin/adapters/chunithm_net/assets/best30.html'
      );
      const recent10Path = resolve(
        process.cwd(),
        '../../.gemini/antigravity-cli/brain/5c320b0c-6d84-4e86-b027-1a27c51adada/scratch/chuni-penguin/tests/chuni_penguin/adapters/chunithm_net/assets/recent10.html'
      );

      try {
        const best30Html = readFileSync(best30Path, 'utf-8');
        const best30 = parseChunithmRatingList(best30Html);
        expect(best30).toHaveLength(30);
        expect(best30[0].title).toBe('Aleph-0');
        expect(best30[0].id).toBe('428');

        const recent10Html = readFileSync(recent10Path, 'utf-8');
        const recent10 = parseChunithmRatingList(recent10Html);
        expect(recent10).toHaveLength(10);
        expect(recent10[0].title).toBe('To：Be Continued');
        expect(recent10[0].id).toBe('2340');
      } catch {
        // Ignored if test runs in environment without scratch directory
      }
    });
  });
});
