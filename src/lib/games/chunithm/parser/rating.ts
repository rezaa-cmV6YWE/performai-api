import * as cheerio from 'cheerio';

import { DIFF_INDEX_MAP, type Difficulty } from '@/lib/games/chunithm/consts';

export interface RawChunithmRatingRecord {
  id: string;
  title: string;
  difficulty: Difficulty;
  score: number;
  combo: string | null;
  chain: string | null;
}

export function parseRatingDifficulty(diffValue?: string, boxClass?: string): Difficulty {
  if (diffValue !== undefined && diffValue !== '') {
    const num = Number(diffValue);
    if (num in DIFF_INDEX_MAP) {
      return DIFF_INDEX_MAP[num];
    }
  }

  if (boxClass) {
    if (boxClass.includes('bg_basic')) return 'basic';
    if (boxClass.includes('bg_advanced')) return 'advanced';
    if (boxClass.includes('bg_expert')) return 'expert';
    if (boxClass.includes('bg_master')) return 'master';
    if (boxClass.includes('bg_ultima')) return 'ultima';
  }

  return 'master';
}

export function capitalizeDifficulty(diff: Difficulty): string {
  return diff.charAt(0).toUpperCase() + diff.slice(1);
}

export function extractToken(html: string): string | null {
  const $ = cheerio.load(html);
  const token = $('input[name="token"]').first().val()?.toString().trim();
  return token || null;
}

export function parseComboFromSrc(src: string): string | null {
  if (src.includes('alljusticecritical')) return 'ajc';
  if (src.includes('alljustice')) return 'aj';
  if (src.includes('fullcombo')) return 'fc';
  return null;
}

export function parseChainFromSrc(src: string): string | null {
  if (src.includes('fullchain2')) return 'fch';
  if (src.includes('fullchain')) return 'fch+';
  return null;
}

export function parseChunithmRatingList(html: string): RawChunithmRatingRecord[] {
  const $ = cheerio.load(html);
  const records: RawChunithmRatingRecord[] = [];

  $('form:has(.musiclist_box)').each((_, formElem) => {
    const $form = $(formElem);
    const $box = $form.find('.musiclist_box');

    const id = $form.find('input[name="idx"]').val()?.toString().trim();
    const diffVal = $form.find('input[name="diff"]').val()?.toString().trim();
    const boxClass = $box.attr('class') ?? '';
    const title = $form.find('.music_title, .musiclist_worldsend_title').first().text().trim();
    const scoreText = $form.find('.play_musicdata_highscore .text_b').first().text().trim();

    if (!id || !title || !scoreText) return;

    const score = Number(scoreText.replace(/,/g, ''));
    if (!Number.isFinite(score)) return;

    const difficulty = parseRatingDifficulty(diffVal, boxClass);

    let combo: string | null = null;
    let chain: string | null = null;

    $form.find('img').each((_i, imgEl) => {
      const src = $(imgEl).attr('src');
      if (!src) return;

      const parsedCombo = parseComboFromSrc(src);
      if (parsedCombo) {
        if (!combo || parsedCombo === 'ajc' || (parsedCombo === 'aj' && combo === 'fc')) {
          combo = parsedCombo;
        }
      }

      const parsedChain = parseChainFromSrc(src);
      if (parsedChain) {
        if (!chain || parsedChain === 'fch+') {
          chain = parsedChain;
        }
      }
    });

    records.push({
      id,
      title,
      difficulty,
      score,
      combo,
      chain,
    });
  });

  return records;
}
