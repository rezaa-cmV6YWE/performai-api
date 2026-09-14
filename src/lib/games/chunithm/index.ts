import { AuthError, FetchError } from '@/lib/errors';
import { refreshSession } from '@/lib/games/chunithm/auth';
import { CHUNITHM_URLS, type ChunithmServer } from '@/lib/games/chunithm/consts';
import { chunithmFetch } from '@/lib/games/chunithm/http';
import { parseActiveCollection, parseProfile } from '@/lib/games/chunithm/parser/profile';
import type { ChunithmProfileExtended } from '@/lib/games/chunithm/schemas';
import { parseCookies } from '@/lib/shared/cookies';

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

export * from './auth';
export * from './consts';
export * from './http';
export * from './parser/profile';
export * from './schemas';
