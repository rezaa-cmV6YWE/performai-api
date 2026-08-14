import { AuthError, GameError } from '@/lib/errors';
import { MAIMAI_URLS, type MaimaiServer } from '@/lib/games/maimai/consts';
import { maimaiFetch } from '@/lib/games/maimai/http';
import { parseActiveCollection, parseProfile } from '@/lib/games/maimai/parser';
import type { MaimaiProfileExtended } from '@/lib/games/maimai/schemas';

export async function getMaimaiProfile(
  server: MaimaiServer,
  cookie: string
): Promise<MaimaiProfileExtended> {
  const baseUrl = MAIMAI_URLS[server];
  const profile = await maimaiFetch(`${baseUrl}/playerData/`, cookie);
  const nameplate = await maimaiFetch(`${baseUrl}/collection/nameplate/`, cookie);
  const frame = await maimaiFetch(`${baseUrl}/collection/frame/`, cookie);

  const isAuthError = [profile, nameplate, frame].some(
    (res) => res.status === 401 || res.status === 403
  );

  if (isAuthError) {
    throw new AuthError('invalid or expired session cookie');
  }

  if (!profile.ok || !nameplate.ok || !frame.ok) {
    throw new GameError(`maimai returned ${profile.status}`, 'FETCH_ERROR', profile.status);
  }

  const profileHtml = await profile.text();
  const nameplateHtml = await nameplate.text();
  const frameHtml = await frame.text();

  const parsedProfile = parseProfile(profileHtml, server);
  const parsedNameplate = parseActiveCollection(nameplateHtml, server);
  const parsedFrame = parseActiveCollection(frameHtml, server);

  return {
    ...parsedProfile,
    nameplate: parsedNameplate,
    frame: parsedFrame,
  };
}
