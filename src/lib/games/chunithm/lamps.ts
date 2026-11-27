import type { Difficulty } from '@/lib/games/chunithm/consts';
import { chunithmFetch } from '@/lib/games/chunithm/http';
import { capitalizeDifficulty, parseChunithmRatingList } from '@/lib/games/chunithm/parser/rating';

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
