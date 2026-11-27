import { getFcImageUrl, getFsImageUrl, getJacketUrl } from '@/lib/games/maimai/assets';
import { ensureMaimaiSession, loginMaimaiIntl } from '@/lib/games/maimai/auth';
import { MAIMAI_URLS, type MaimaiServer } from '@/lib/games/maimai/consts';
import { maimaiFetch } from '@/lib/games/maimai/http';
import {
  parseActiveCollection,
  parseCircle,
  parseProfile,
} from '@/lib/games/maimai/parser/profile';
import { fetchAllScoreData, type ScoreData } from '@/lib/games/maimai/parser/scores';
import {
  calculateSongRating,
  computeRatingSongs,
  type RatedScore,
} from '@/lib/games/maimai/rating/calculator';
import { fetchOtogeDbSongs, findChart, type OtogeDbChart } from '@/lib/games/maimai/songs/otoge-db';
import { assertResponsesOk } from '@/lib/shared/http';
import type { LoginBody } from '@/modules/common/model';
import type { MaimaiProfileExtended, MaimaiRating, MaimaiRatingSong } from '@/modules/maimai/model';

const PROFILE_PATHS = ['/playerData/', '/collection/nameplate/', '/collection/frame/', '/circle/'];

export abstract class MaimaiService {
  static login({ segaId, password }: LoginBody): Promise<string> {
    return loginMaimaiIntl(segaId, password);
  }

  static async profile(server: MaimaiServer, cookie: string): Promise<MaimaiProfileExtended> {
    const session = await ensureMaimaiSession(cookie);
    const baseUrl = MAIMAI_URLS[server];

    const responses = await Promise.all(
      PROFILE_PATHS.map((path) => maimaiFetch(`${baseUrl}${path}`, session))
    );
    assertResponsesOk('maimai', responses);

    const [profileHtml, nameplateHtml, frameHtml, circleHtml] = await Promise.all(
      responses.map((res) => res.text())
    );

    return {
      ...parseProfile(profileHtml, server),
      nameplate: parseActiveCollection(nameplateHtml, server),
      frame: parseActiveCollection(frameHtml, server),
      circle: parseCircle(circleHtml, server),
    };
  }

  static async rating(cookie: string): Promise<MaimaiRating> {
    const session = await ensureMaimaiSession(cookie);

    const [otogeDb, scores] = await Promise.all([fetchOtogeDbSongs(), fetchAllScoreData(session)]);

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
      newRatingSongs: newRatingSongs.map(toRatingSong),
      oldRatingSongs: oldRatingSongs.map(toRatingSong),
    };
  }
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

function toRatingSong(score: RatedScore): MaimaiRatingSong {
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
