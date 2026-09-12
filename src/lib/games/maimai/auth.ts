import { AuthError, GameError } from '@/lib/errors';
import {
  DEFAULT_HEADERS,
  MAIMAI_AUTH_GATEWAY_URL,
  MAIMAI_BACK_URL,
  MAIMAI_URLS,
} from '@/lib/games/maimai/consts';
import { cookieBag, findCookie, mergeCookies, parseCookies } from '@/lib/games/maimai/cookies';
import { followRedirects } from '@/lib/games/maimai/http';

const LOGIN_PAGE_URL = `${MAIMAI_AUTH_GATEWAY_URL}/login?site_id=maimaidxex&redirect_url=${encodeURIComponent(`${MAIMAI_URLS.intl}/`)}&back_url=${MAIMAI_BACK_URL}`;

const LOGIN_POST_URL = `${MAIMAI_AUTH_GATEWAY_URL}/login/sid?retention=1`;

export async function loginMaimaiIntl(segaId: string, password: string): Promise<string> {
  const loginPage = await fetch(LOGIN_PAGE_URL, {
    headers: DEFAULT_HEADERS,
    redirect: 'manual',
  });

  const preCookies = cookieBag(loginPage.headers.getSetCookie());

  const body = new URLSearchParams({ sid: segaId, password });
  const loginRes = await fetch(LOGIN_POST_URL, {
    method: 'POST',
    headers: {
      ...DEFAULT_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: preCookies,
    },
    body: body.toString(),
    redirect: 'manual',
  });

  const location = loginRes.headers.get('location') ?? '';

  if (loginRes.status !== 302) {
    throw new AuthError('invalid credentials or login blocked');
  }

  if (location.includes('/common_auth/login') || location.includes('alof=')) {
    throw new AuthError('invalid credentials');
  }

  const baseOrigin = new URL(MAIMAI_URLS.intl).origin;
  if (!location.includes(baseOrigin)) {
    throw new GameError('unexpected login redirect', 'UNEXPECTED_REDIRECT', 500);
  }

  const clal = findCookie(loginRes.headers.getSetCookie(), 'clal');
  if (!clal) {
    throw new GameError('login succeeded but no session cookie returned', 'NO_SESSION_COOKIE', 500);
  }

  const initialCookie = mergeCookies(preCookies, loginRes.headers.getSetCookie());
  const final = await followRedirects(location, initialCookie);

  // Return clal along with the session cookies so that subsequent requests
  // on Cloudflare Workers can regenerate the IP-bound session cookies if needed.
  const allowed = new Set(['clal', '_t', 'userId', 'AWSALBTG', 'AWSALBTGCORS']);
  const finalMap = parseCookies(final.cookie);
  const filtered = Array.from(finalMap.entries())
    .filter(([k]) => allowed.has(k))
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');

  return filtered;
}

/**
 * Exchanges a long-lived 'clal' token for fresh, IP-bound session cookies ('_t', 'userId').
 * This is crucial for Cloudflare Workers where the outbound IP changes per request.
 */
export async function refreshSession(clalCookie: string): Promise<string> {
  const clalMap = parseCookies(clalCookie);
  const clal = clalMap.get('clal');
  if (!clal) {
    throw new AuthError('clal token not found in cookie');
  }

  const loginUrl = `${MAIMAI_AUTH_GATEWAY_URL}/login?site_id=maimaidxex&redirect_url=${encodeURIComponent(`${MAIMAI_URLS.intl}/`)}&back_url=${MAIMAI_BACK_URL}`;

  const response = await fetch(loginUrl, {
    headers: { ...DEFAULT_HEADERS, Cookie: `clal=${clal}` },
    redirect: 'manual',
  });

  if (response.status !== 302) {
    throw new AuthError('invalid or expired clal token');
  }

  const location = response.headers.get('location');
  if (!location || location.includes('/common_auth/login') || location.includes('alof=')) {
    throw new AuthError('invalid or expired clal token');
  }

  const final = await followRedirects(location, '');

  const allowed = new Set(['_t', 'userId', 'AWSALBTG', 'AWSALBTGCORS']);
  const finalMap = parseCookies(final.cookie);
  const filtered = Array.from(finalMap.entries())
    .filter(([k]) => allowed.has(k))
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');

  return filtered;
}
