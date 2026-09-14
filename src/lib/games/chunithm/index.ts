import { AuthError, FetchError } from '@/lib/errors';
import { getChainImageUrl, getComboImageUrl } from '@/lib/games/chunithm/assets';
import { refreshSession } from '@/lib/games/chunithm/auth';
import { CHUNITHM_URLS, type ChunithmServer, type Difficulty } from '@/lib/games/chunithm/consts';
import { chunithmFetch } from '@/lib/games/chunithm/http';
import { parseActiveCollection, parseProfile } from '@/lib/games/chunithm/parser/profile';
import {
  capitalizeDifficulty,
  extractToken,
  parseChunithmRatingList,
  type RawChunithmRatingRecord,
} from '@/lib/games/chunithm/parser/rating';
import { calculateSongRating, computeTotalRating } from '@/lib/games/chunithm/rating/calculator';
import type {
  ChunithmProfileExtended,
  ChunithmRating,
  ChunithmRatingSong,
} from '@/lib/games/chunithm/schemas';
import { fetchChunithmOtogeDb, findChunithmChart } from '@/lib/games/chunithm/songs/otoge-db';
import { parseCookies } from '@/lib/shared/cookies';

export interface ChunithmLampRecord {
  combo: string | null;
  chain: string | null;
}

export async function fetchChunithmDifficultyLamps(
  baseUrl: string,
  sessionCookie: string,
  token: string,
  difficulties: Difficulty[],
  fetcher: typeof chunithmFetch = chunithmFetch
): Promise<Map<string, ChunithmLampRecord>> {
  const lampsMap = new Map<string, ChunithmLampRecord>();
  if (!token || difficulties.length === 0) {
    return lampsMap;
  }

  await Promise.allSettled(
    difficulties.map(async (diff) => {
      try {
        const capitalized = capitalizeDifficulty(diff);
        const url = `${baseUrl}/record/musicGenre/send${capitalized}`;
        const res = await fetcher(url, sessionCookie, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Referer: `${baseUrl}/record/musicGenre/`,
          },
          body: `genre=99&token=${encodeURIComponent(token)}`,
        });

        if (!res.ok) return;

        const html = await res.text();
        const records = parseChunithmRatingList(html);
        for (const record of records) {
          lampsMap.set(`${record.id}@${record.difficulty}`, {
            combo: record.combo,
            chain: record.chain,
          });
        }
      } catch {
        // Non-fatal: if difficulty fetch fails, lamps for this difficulty remain null
      }
    })
  );

  return lampsMap;
}

export async function getChunithmProfile(
  server: ChunithmServer,
  cookie: string
): Promise<ChunithmProfileExtended> {
  let sessionCookie = cookie;
  const parsed = parseCookies(cookie);
  if (!parsed.has('_t') && parsed.has('clal')) {
    sessionCookie = await refreshSession(cookie);
  }

  const baseUrl = CHUNITHM_URLS[server];
  const [profileRes, collectionRes] = await Promise.all([
    chunithmFetch(`${baseUrl}/home/playerData`, sessionCookie),
    chunithmFetch(`${baseUrl}/collection/customise`, sessionCookie),
  ]);

  const isAuthError = [profileRes, collectionRes].some(
    (res) => res.status === 401 || res.status === 403
  );

  if (isAuthError) {
    const statuses = [profileRes.status, collectionRes.status].join(', ');
    throw new AuthError(`invalid or expired session cookie (HTTP ${statuses})`);
  }

  if (!profileRes.ok || !collectionRes.ok) {
    const failedStatus = !profileRes.ok ? profileRes.status : collectionRes.status;
    throw new FetchError(`chunithm returned ${failedStatus}`, failedStatus);
  }

  const [profileHtml, collectionHtml] = await Promise.all([
    profileRes.text(),
    collectionRes.text(),
  ]);

  const profile = parseProfile(profileHtml, server);
  const nameplate = parseActiveCollection(collectionHtml, server);

  return {
    ...profile,
    nameplate,
  };
}

export async function getChunithmRating(
  server: ChunithmServer,
  cookie: string
): Promise<ChunithmRating> {
  let sessionCookie = cookie;
  const parsed = parseCookies(cookie);
  if (!parsed.has('_t') && parsed.has('clal')) {
    sessionCookie = await refreshSession(cookie);
  }

  const baseUrl = CHUNITHM_URLS[server];

  const [otogeDb, best30Res, recent10Res] = await Promise.all([
    fetchChunithmOtogeDb(server),
    chunithmFetch(`${baseUrl}/home/playerData/ratingDetailBest/`, sessionCookie),
    chunithmFetch(`${baseUrl}/home/playerData/ratingDetailRecent/`, sessionCookie),
  ]);

  const isAuthError = [best30Res, recent10Res].some(
    (res) => res.status === 401 || res.status === 403
  );

  if (isAuthError) {
    const statuses = [best30Res.status, recent10Res.status].join(', ');
    throw new AuthError(`invalid or expired session cookie (HTTP ${statuses})`);
  }

  if (!best30Res.ok || !recent10Res.ok) {
    const failedStatus = !best30Res.ok ? best30Res.status : recent10Res.status;
    throw new FetchError(`chunithm returned ${failedStatus}`, failedStatus);
  }

  const [best30Html, new20Html] = await Promise.all([best30Res.text(), recent10Res.text()]);

  const rawBest30 = parseChunithmRatingList(best30Html);
  const rawNew20 = parseChunithmRatingList(new20Html);

  const uniqueDifficulties = Array.from(
    new Set([...rawBest30, ...rawNew20].map((r) => r.difficulty))
  );

  const token =
    parseCookies(sessionCookie).get('_t') ??
    extractToken(best30Html) ??
    extractToken(new20Html) ??
    null;

  let lampsMap = new Map<string, ChunithmLampRecord>();
  if (token && uniqueDifficulties.length > 0) {
    lampsMap = await fetchChunithmDifficultyLamps(
      baseUrl,
      sessionCookie,
      token,
      uniqueDifficulties
    );
  }

  const hydrateScore = (record: RawChunithmRatingRecord): ChunithmRatingSong => {
    const chart = findChunithmChart(otogeDb, record.id, record.difficulty);
    const internalLevel = chart?.internalLevel ?? null;
    const rating = calculateSongRating(record.score, internalLevel);

    const lamp = lampsMap.get(`${record.id}@${record.difficulty}`);
    const comboType = record.combo ?? lamp?.combo ?? null;
    const chainType = record.chain ?? lamp?.chain ?? null;

    return {
      id: record.id,
      title: chart?.title ?? record.title,
      difficulty: record.difficulty,
      level: chart?.level ?? null,
      internalLevel,
      score: record.score,
      rating,
      jacket: chart?.imageUrl ?? null,
      combo: {
        type: comboType,
        image: getComboImageUrl(comboType, server),
      },
      chain: {
        type: chainType,
        image: getChainImageUrl(chainType, server),
      },
    };
  };

  const oldRatingSongs = rawBest30.map(hydrateScore);
  const newRatingSongs = rawNew20.map(hydrateScore);

  const rating = computeTotalRating(
    oldRatingSongs.map((s) => s.rating),
    newRatingSongs.map((s) => s.rating)
  );

  return {
    rating,
    newRatingSongs,
    oldRatingSongs,
  };
}

export * from './assets';
export * from './auth';
export * from './consts';
export * from './http';
export * from './parser/profile';
export * from './parser/rating';
export * from './rating/calculator';
export * from './schemas';
export * from './songs/otoge-db';
