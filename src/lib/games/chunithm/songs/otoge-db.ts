import { FetchError } from '@/lib/errors';
import {
  CHUNITHM_URLS,
  type ChunithmServer,
  DIFF_KEY_MAP,
  DIFFICULTIES,
  type Difficulty,
  OTOGEDB_INTL_URL,
} from '@/lib/games/chunithm/consts';
import { DEFAULT_HEADERS } from '@/lib/shared/consts';

export interface ChunithmChartMeta {
  title: string;
  level: string;
  internalLevel: number | null;
  imageUrl: string | null;
}

export interface ChunithmSongMeta {
  id: string;
  title: string;
  artist?: string;
  image?: string;
  charts: Partial<Record<Difficulty, ChunithmChartMeta>>;
}

export interface ChunithmOtogeDb {
  byId: Map<string, ChunithmSongMeta>;
}

interface OtogeDbRawSong {
  id: string;
  title: string;
  artist?: string;
  image?: string;
  lev_bas?: string;
  lev_adv?: string;
  lev_exp?: string;
  lev_mas?: string;
  lev_ult?: string;
  lev_bas_i?: string;
  lev_adv_i?: string;
  lev_exp_i?: string;
  lev_mas_i?: string;
  lev_ult_i?: string;
  [key: string]: unknown;
}

export function parseInternalLevel(internalVal?: string, displayVal?: string): number | null {
  if (internalVal && internalVal.trim() !== '') {
    const num = Number(internalVal);
    if (Number.isFinite(num)) return num;
  }
  if (displayVal && displayVal.trim() !== '') {
    const trimmed = displayVal.trim();
    if (trimmed.endsWith('+')) {
      const base = Number(trimmed.slice(0, -1));
      if (Number.isFinite(base)) return base + 0.7;
    }
    const num = Number(trimmed);
    if (Number.isFinite(num)) return num;
  }
  return null;
}

export async function fetchChunithmOtogeDb(
  server: ChunithmServer = 'intl'
): Promise<ChunithmOtogeDb> {
  const res = await fetch(OTOGEDB_INTL_URL, {
    headers: DEFAULT_HEADERS,
  });

  if (!res.ok) {
    throw new FetchError(`failed to fetch chunithm otoge-db: ${res.status}`, res.status);
  }

  const rawSongs = (await res.json()) as OtogeDbRawSong[];
  const byId = new Map<string, ChunithmSongMeta>();
  const baseUrl = CHUNITHM_URLS[server];

  for (const raw of rawSongs) {
    const id = String(raw.id);
    const imageUrl = raw.image ? `${baseUrl}/img/${raw.image}` : null;
    const charts: Partial<Record<Difficulty, ChunithmChartMeta>> = {};

    for (const diff of DIFFICULTIES) {
      const { displayKey, internalKey } = DIFF_KEY_MAP[diff];
      const displayVal = raw[displayKey];
      if (typeof displayVal === 'string' && displayVal.trim() !== '') {
        const internalVal = raw[internalKey];
        const internalLevel = parseInternalLevel(
          typeof internalVal === 'string' ? internalVal : undefined,
          displayVal
        );

        charts[diff] = {
          title: raw.title,
          level: displayVal.trim(),
          internalLevel,
          imageUrl,
        };
      }
    }

    byId.set(id, {
      id,
      title: raw.title,
      artist: raw.artist,
      image: raw.image,
      charts,
    });
  }

  return { byId };
}

export function findChunithmChart(
  otogeDb: ChunithmOtogeDb,
  songId: string,
  difficulty: Difficulty
): ChunithmChartMeta | undefined {
  return otogeDb.byId.get(songId)?.charts[difficulty];
}
