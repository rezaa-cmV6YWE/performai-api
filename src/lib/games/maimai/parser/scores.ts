import { load } from 'cheerio';

import { AuthError, FetchError } from '@/lib/errors';
import {
  DIFFICULTIES,
  type Difficulty,
  DIFFICULTY_SELECTORS,
  MAIMAI_URLS,
} from '@/lib/games/maimai/consts';
import { maimaiFetch } from '@/lib/games/maimai/http';
import { basenameFromUrl, normalizeName } from '@/lib/games/maimai/parser/name';

export type { Difficulty };

export interface ScoreData {
  songName: string;
  type: 'std' | 'dx';
  difficulty: Difficulty;
  difficultyNumber: number;
  level: string;
  achievement: number; // 10000x (e.g. 1005000 for 100.5%)
  dxScore: number;
  fc: string | null;
  fs: string | null;
  imageUrl?: string; // jacket filename used to match song metadata
}

function musicTypeFromIcon(iconSrc: string | undefined): 'std' | 'dx' | null {
  if (!iconSrc) return null;
  if (iconSrc.includes('music_dx.png')) return 'dx';
  if (iconSrc.includes('music_standard.png')) return 'std';
  return null;
}

export function parseFcFromSrc(src: string | undefined): string | null {
  if (!src) return null;
  if (src.includes('music_icon_app.png') || src.includes('_app.png')) return 'ap+';
  if (src.includes('music_icon_ap.png') || src.includes('_ap.png')) return 'ap';
  if (src.includes('music_icon_fcp.png') || src.includes('_fcp.png')) return 'fc+';
  if (src.includes('music_icon_fc.png') || src.includes('_fc.png')) return 'fc';
  return null;
}

export function parseFsFromSrc(src: string | undefined): string | null {
  if (!src) return null;
  if (
    src.includes('music_icon_fsdp.png') ||
    src.includes('_fsdp.png') ||
    src.includes('music_icon_fdxp.png') ||
    src.includes('_fdxp.png')
  ) {
    return 'fdx+';
  }
  if (
    src.includes('music_icon_fsd.png') ||
    src.includes('_fsd.png') ||
    src.includes('music_icon_fdx.png') ||
    src.includes('_fdx.png')
  ) {
    return 'fdx';
  }
  if (src.includes('music_icon_fsp.png') || src.includes('_fsp.png')) return 'fs+';
  if (src.includes('music_icon_fs.png') || src.includes('_fs.png')) return 'fs';
  if (src.includes('music_icon_sync.png') || src.includes('_sync.png')) return 'sync';
  return null;
}

type CheerioRoot = ReturnType<typeof load>;

const JACKET_SELECTORS = [
  'img[src*="/Music/"]',
  'img.music_img',
  'img.jacket_img',
  'img[src*="/jacket/"]',
];

function findJacketSrc($root: ReturnType<CheerioRoot>): string | undefined {
  for (const selector of JACKET_SELECTORS) {
    const src = $root.find(selector).attr('src');
    if (src) return src;
  }
  return undefined;
}

export function parseScoreData(html: string, difficultyNumber: number): ScoreData[] {
  const $ = load(html);
  const selector = DIFFICULTY_SELECTORS[difficultyNumber];
  if (!selector) return [];

  const difficultyName = DIFFICULTIES[difficultyNumber];
  if (!difficultyName) return [];

  const scores: ScoreData[] = [];

  $(selector).each((_, element) => {
    const block = $(element);

    const scoreBlocks = block.find('.music_score_block');
    if (scoreBlocks.length === 0) {
      return; // unplayed
    }

    const parent = block.parent();
    const iconSrc =
      block.find('img.music_kind_icon').attr('src') ||
      parent.find('img.music_kind_icon').attr('src');
    const type = musicTypeFromIcon(iconSrc);
    if (!type) return;

    const rawName = block.find('.music_name_block').text().trim();
    const name = normalizeName(rawName);
    if (!name) return;

    const level = block.find('.music_lv_block').text().trim();

    const achievementText = scoreBlocks.eq(0).text().trim();
    const achievementMatch = achievementText.match(/(\d+\.?\d*)%/);
    if (!achievementMatch) return;
    const achievement = Math.round(Number(achievementMatch[1]) * 10000);

    const dxScoreText = scoreBlocks.eq(1).text().trim();
    const dxScoreMatch = dxScoreText.match(/(\d+)\s*\/\s*\d+/);
    const dxScore = dxScoreMatch ? Number(dxScoreMatch[1]) : 0;

    let fc: string | null = null;
    let fs: string | null = null;

    block.find('img').each((_i, imgEl) => {
      const src = $(imgEl).attr('src');
      if (!src) return;

      const parsedFc = parseFcFromSrc(src);
      if (parsedFc) {
        fc = parsedFc;
      }

      const parsedFs = parseFsFromSrc(src);
      if (parsedFs) {
        fs = parsedFs;
      }
    });

    const jacketSrc = findJacketSrc(block) || findJacketSrc(parent);
    const imageUrl = basenameFromUrl(jacketSrc);

    scores.push({
      songName: name,
      type,
      difficulty: difficultyName,
      difficultyNumber,
      level,
      achievement,
      dxScore,
      fc,
      fs,
      imageUrl,
    });
  });

  return scores;
}

export async function fetchScoreData(
  cookie: string,
  difficultyNumber: number
): Promise<ScoreData[]> {
  const url = `${MAIMAI_URLS.intl}/record/musicGenre/search/?genre=99&diff=${difficultyNumber}`;
  const res = await maimaiFetch(url, cookie);

  if (res.status === 401 || res.status === 403) {
    throw new AuthError(`session expired or invalid (HTTP ${res.status})`);
  }

  if (!res.ok) {
    throw new FetchError(`maimai returned ${res.status}`, res.status);
  }

  const html = await res.text();
  return parseScoreData(html, difficultyNumber);
}

export async function fetchAllScoreData(cookie: string): Promise<ScoreData[]> {
  const results: ScoreData[][] = [];
  for (const difficulty of [0, 1, 2, 3, 4]) {
    // oxlint-disable-next-line no-await-in-loop
    results.push(await fetchScoreData(cookie, difficulty));
    // Optional delay can be added here if needed, but sequential is usually enough
  }
  return results.flat();
}
