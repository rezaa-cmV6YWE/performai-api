import { getChainImageUrl, getComboImageUrl } from '@/lib/games/chunithm/assets';
import { ensureChunithmSession, loginChunithmIntl } from '@/lib/games/chunithm/auth';
import { CHUNITHM_URLS, type ChunithmServer } from '@/lib/games/chunithm/consts';
import { chunithmFetch } from '@/lib/games/chunithm/http';
import { type ChunithmLampRecord, fetchChunithmDifficultyLamps } from '@/lib/games/chunithm/lamps';
import { parseActiveCollection, parseProfile } from '@/lib/games/chunithm/parser/profile';
import {
  extractToken,
  parseChunithmRatingList,
  type RawChunithmRatingRecord,
} from '@/lib/games/chunithm/parser/rating';
import { calculateSongRating, computeTotalRating } from '@/lib/games/chunithm/rating/calculator';
import {
  type ChunithmOtogeDb,
  fetchChunithmOtogeDb,
  findChunithmChart,
} from '@/lib/games/chunithm/songs/otoge-db';
import { parseCookies } from '@/lib/shared/cookies';
import { assertResponsesOk } from '@/lib/shared/http';
import type {
  ChunithmProfileExtended,
  ChunithmRating,
  ChunithmRatingSong,
} from '@/modules/chunithm/model';
import type { LoginBody } from '@/modules/common/model';

export abstract class ChunithmService {
  static login({ segaId, password }: LoginBody): Promise<string> {
    return loginChunithmIntl(segaId, password);
  }

  static async profile(server: ChunithmServer, cookie: string): Promise<ChunithmProfileExtended> {
    const session = await ensureChunithmSession(cookie);
    const baseUrl = CHUNITHM_URLS[server];

    const [profileRes, collectionRes] = await Promise.all([
      chunithmFetch(`${baseUrl}/home/playerData`, session),
      chunithmFetch(`${baseUrl}/collection/customise`, session),
    ]);
    assertResponsesOk('chunithm', [profileRes, collectionRes]);

    const [profileHtml, collectionHtml] = await Promise.all([
      profileRes.text(),
      collectionRes.text(),
    ]);

    return {
      ...parseProfile(profileHtml, server),
      nameplate: parseActiveCollection(collectionHtml, server),
    };
  }

  static async rating(server: ChunithmServer, cookie: string): Promise<ChunithmRating> {
    const session = await ensureChunithmSession(cookie);
    const baseUrl = CHUNITHM_URLS[server];

    const [otogeDb, best30Res, recent10Res] = await Promise.all([
      fetchChunithmOtogeDb(server),
      chunithmFetch(`${baseUrl}/home/playerData/ratingDetailBest/`, session),
      chunithmFetch(`${baseUrl}/home/playerData/ratingDetailRecent/`, session),
    ]);
    assertResponsesOk('chunithm', [best30Res, recent10Res]);

    const [best30Html, new20Html] = await Promise.all([best30Res.text(), recent10Res.text()]);

    const rawBest30 = parseChunithmRatingList(best30Html);
    const rawNew20 = parseChunithmRatingList(new20Html);

    const difficulties = Array.from(new Set([...rawBest30, ...rawNew20].map((r) => r.difficulty)));

    const token =
      parseCookies(session).get('_t') ?? extractToken(best30Html) ?? extractToken(new20Html);

    const lamps = token
      ? await fetchChunithmDifficultyLamps(baseUrl, session, token, difficulties)
      : new Map<string, ChunithmLampRecord>();

    const oldRatingSongs = rawBest30.map((r) => toRatingSong(r, otogeDb, lamps, server));
    const newRatingSongs = rawNew20.map((r) => toRatingSong(r, otogeDb, lamps, server));

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
}

function toRatingSong(
  record: RawChunithmRatingRecord,
  otogeDb: ChunithmOtogeDb,
  lamps: Map<string, ChunithmLampRecord>,
  server: ChunithmServer
): ChunithmRatingSong {
  const chart = findChunithmChart(otogeDb, record.id, record.difficulty);
  const internalLevel = chart?.internalLevel ?? null;
  const rating = calculateSongRating(record.score, internalLevel);

  const lamp = lamps.get(`${record.id}@${record.difficulty}`);
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
}
