import { AuthError, GameError } from '@/lib/errors';
import type { GameProfile } from '@/lib/games/base';
import { MAIMAI_URLS, type MaimaiServer } from '@/lib/games/maimai/consts';
import { maimaiFetch } from '@/lib/games/maimai/http';
import { parseProfile } from '@/lib/games/maimai/parser';

export async function getMaimaiProfile(server: MaimaiServer, cookie: string): Promise<GameProfile> {
  const baseUrl = MAIMAI_URLS[server];
  const res = await maimaiFetch(`${baseUrl}/home/`, cookie);

  if (res.status === 401 || res.status === 403) {
    throw new AuthError('invalid or expired session cookie');
  }
  if (!res.ok) {
    throw new GameError(`maimai returned ${res.status}`, 'FETCH_ERROR', res.status);
  }

  const html = await res.text();
  return parseProfile(html);
}
