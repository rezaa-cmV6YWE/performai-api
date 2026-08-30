import { AuthError, FetchError } from '@/lib/errors';
import {
  getFcImageUrl,
  getFsImageUrl,
  getJacketUrl,
  getRatingBadgeUrl,
} from '@/lib/games/maimai/assets';
import { MAIMAI_URLS, type MaimaiServer } from '@/lib/games/maimai/consts';
import { maimaiFetch } from '@/lib/games/maimai/http';
import { parseActiveCollection, parseProfile } from '@/lib/games/maimai/parser/profile';
import { fetchAllScoreData, type ScoreData } from '@/lib/games/maimai/parser/scores';
import {
  calculateSongRating,
  computeRatingSongs,
  type RatedScore,
} from '@/lib/games/maimai/rating/calculator';
import type { MaimaiProfileExtended, MaimaiRating } from '@/lib/games/maimai/schemas';
import { fetchOtogeDbSongs, findChart, type OtogeDbChart } from '@/lib/games/maimai/songs/otoge-db';

export async function getMaimaiProfile(
  server: MaimaiServer,
  cookie: string
): Promise<MaimaiProfileExtended> {
  const baseUrl = MAIMAI_URLS[server];

  const [profileRes, nameplateRes, frameRes] = await Promise.all([
    maimaiFetch(`${baseUrl}/playerData/`, cookie),
    maimaiFetch(`${baseUrl}/collection/nameplate/`, cookie),
    maimaiFetch(`${baseUrl}/collection/frame/`, cookie),
  ]);

  const isAuthError = [profileRes, nameplateRes, frameRes].some(
    (res) => res.status === 401 || res.status === 403
  );

  if (isAuthError) {
    throw new AuthError('invalid or expired session cookie');
  }

  if (!profileRes.ok || !nameplateRes.ok || !frameRes.ok) {
    const failedStatus = !profileRes.ok
      ? profileRes.status
      : !nameplateRes.ok
        ? nameplateRes.status
        : frameRes.status;
    throw new FetchError(`maimai returned ${failedStatus}`, failedStatus);
  }

  const [profileHtml, nameplateHtml, frameHtml] = await Promise.all([
    profileRes.text(),
    nameplateRes.text(),
    frameRes.text(),
  ]);

  const parsedProfile = parseProfile(profileHtml, server);
  const parsedNameplate = parseActiveCollection(nameplateHtml, server);
  const parsedFrame = parseActiveCollection(frameHtml, server);

  return {
    ...parsedProfile,
    nameplate: parsedNameplate,
    frame: parsedFrame,
  };
}

function rateScore(score: ScoreData, chart: OtogeDbChart, currentVersion: number): RatedScore {
  return {
    ...score,
    internalLevel: chart.internalLevel,
    addedVersion: chart.addedVersion,
    rating: calculateSongRating(score.achievement, chart.internalLevel, currentVersion, score.fc),
    jacket: getJacketUrl(chart.imageUrl),
  };
}

function toRatingSong(score: RatedScore): MaimaiRating['newRatingSongs'][number] {
  return {
    name: score.songName,
    type: score.type,
    difficulty: score.difficulty,
    level: score.level,
    internalLevel: score.internalLevel,
    achievement: score.achievement / 10000,
    dxScore: score.dxScore,
    rating: score.rating,
    jacket: score.jacket,
    combo: {
      type: score.fc,
      image: getFcImageUrl(score.fc),
    },
    sync: {
      type: score.fs,
      image: getFsImageUrl(score.fs),
    },
  };
}

export async function getMaimaiRating(
  _server: MaimaiServer,
  cookie: string
): Promise<MaimaiRating> {
  const [otogeDb, scores] = await Promise.all([fetchOtogeDbSongs(), fetchAllScoreData(cookie)]);

  const ratedScores: RatedScore[] = [];
  for (const score of scores) {
    const chart = findChart(otogeDb, score);
    if (!chart) continue;
    ratedScores.push(rateScore(score, chart, otogeDb.currentVersion));
  }

  const { newRatingSongs, oldRatingSongs, rating } = computeRatingSongs(
    ratedScores,
    otogeDb.currentVersion
  );

  return {
    rating,
    ratingImage: getRatingBadgeUrl(rating, otogeDb.currentVersion),
    newRatingSongs: newRatingSongs.map(toRatingSong),
    oldRatingSongs: oldRatingSongs.map(toRatingSong),
  };
}

export * from '@/lib/games/maimai/assets';
export * from '@/lib/games/maimai/auth';
export * from '@/lib/games/maimai/consts';
export * from '@/lib/games/maimai/cookies';
export * from '@/lib/games/maimai/http';
export * from '@/lib/games/maimai/schemas';
