import { FetchError } from '@/lib/errors';
import {
  DEFAULT_HEADERS,
  DIFFICULTY_MAP,
  MAIMAI_DEFAULT_VERSION,
  OTOGEDB_INTL_URL,
  VERSION_MAJOR_MAP,
} from '@/lib/games/maimai/consts';
import { basenameFromUrl, normalizeName } from '@/lib/games/maimai/parser/name';

export interface OtogeDbChart {
  title: string;
  internalLevel: number;
  addedVersion: number;
  imageUrl?: string;
}

export interface OtogeDbSongs {
  charts: Map<string, OtogeDbChart>;
  byImage: Map<string, OtogeDbChart>;
  currentVersion: number;
}

interface OtogeDbRawSong {
  title: string;
  artist?: string;
  image_url?: string;
  version?: string;
  date_intl_added?: string;
  [key: string]: unknown;
}

export function getChartKey(name: string, type: 'std' | 'dx', difficulty: string): string {
  return `${normalizeName(name)}@${type}@${difficulty}`;
}

export function getImageKey(
  imageUrl: string | undefined,
  type: 'std' | 'dx',
  difficulty: string
): string | undefined {
  const basename = basenameFromUrl(imageUrl);
  if (!basename) return undefined;
  return `${basename}@${type}@${difficulty}`;
}

export function versionCodeToId(code: string): number {
  const major = code.length >= 3 ? Number(code.slice(0, 3)) : NaN;
  if (Number.isNaN(major)) return 0;
  return VERSION_MAJOR_MAP[major] ?? (major > 265 ? 26 + Math.floor((major - 265) / 5) : 0);
}

function getTodayYyyymmdd(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export function detectCurrentVersion(rawSongs: OtogeDbRawSong[]): number {
  const today = getTodayYyyymmdd();
  let maxVersion = 0;

  for (const song of rawSongs) {
    const added = song.date_intl_added;
    if (!added || added === '000000' || added > today) continue;
    const id = versionCodeToId(song.version ?? '');
    if (id > maxVersion) maxVersion = id;
  }

  return maxVersion > 0 ? maxVersion : MAIMAI_DEFAULT_VERSION;
}

const CHART_TYPES = [
  { type: 'std' as const, prefix: 'lev_' },
  { type: 'dx' as const, prefix: 'dx_lev_' },
] as const;

export async function fetchOtogeDbSongs(): Promise<OtogeDbSongs> {
  const res = await fetch(OTOGEDB_INTL_URL, {
    headers: DEFAULT_HEADERS,
  });

  if (!res.ok) {
    throw new FetchError(`failed to fetch otoge-db: ${res.status}`, res.status);
  }

  const songs = (await res.json()) as OtogeDbRawSong[];
  const charts = new Map<string, OtogeDbChart>();
  const byImage = new Map<string, OtogeDbChart>();

  for (const song of songs) {
    const baseName = normalizeName(song.title);
    const addedVersion = versionCodeToId(song.version ?? '');
    const imageBasename = basenameFromUrl(song.image_url);

    for (const [suffix, difficulty] of Object.entries(DIFFICULTY_MAP)) {
      for (const { type, prefix } of CHART_TYPES) {
        const levelVal = song[`${prefix}${suffix}_i`];
        if (typeof levelVal === 'string' && levelVal.trim() !== '') {
          const internalLevel = Number(levelVal);
          if (Number.isFinite(internalLevel)) {
            const chart: OtogeDbChart = {
              title: song.title,
              internalLevel,
              addedVersion,
              imageUrl: song.image_url,
            };
            charts.set(getChartKey(baseName, type, difficulty), chart);
            if (imageBasename) {
              const imageKey = getImageKey(imageBasename, type, difficulty);
              if (imageKey) {
                byImage.set(imageKey, chart);
              }
            }
          }
        }
      }
    }
  }

  const currentVersion = detectCurrentVersion(songs);
  return { charts, byImage, currentVersion };
}

export function findChart(
  otogeDb: OtogeDbSongs,
  score: { songName: string; imageUrl?: string; type: 'std' | 'dx'; difficulty: string }
): OtogeDbChart | undefined {
  if (score.imageUrl) {
    const imageKey = getImageKey(score.imageUrl, score.type, score.difficulty);
    if (imageKey) {
      const byImage = otogeDb.byImage.get(imageKey);
      if (byImage) return byImage;
    }
  }
  return otogeDb.charts.get(getChartKey(score.songName, score.type, score.difficulty));
}
