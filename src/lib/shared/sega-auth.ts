import { AuthError, GameError } from '@/lib/errors';
import { DEFAULT_HEADERS, SEGA_AUTH_GATEWAY_URL } from '@/lib/shared/consts';
import { cookieBag, findCookie, mergeCookies, parseCookies } from '@/lib/shared/cookies';
import { followRedirects } from '@/lib/shared/http';

export interface SegaAuthConfig {
  /** e.g. 'maimaidxex', 'chuniex' */
  siteId: string;
  /** e.g. 'https://maimaidx-eng.com/maimai-mobile/' */
  redirectUrl: string;
  /** e.g. 'https://maimai.sega.com/' */
  backUrl: string;
  /** Cookies to keep in the final filtered output */
  allowedCookies: string[];
}

function buildLoginPageUrl(config: SegaAuthConfig): string {
  return (
    `${SEGA_AUTH_GATEWAY_URL}/login` +
    `?site_id=${config.siteId}` +
    `&redirect_url=${encodeURIComponent(config.redirectUrl)}` +
    `&back_url=${config.backUrl}`
  );
}

const LOGIN_POST_URL = `${SEGA_AUTH_GATEWAY_URL}/login/sid?retention=1`;

/**
 * Performs the 3-step SEGA Aime Gateway login dance:
 * 1. GET login page → capture pre-cookies
 * 2. POST credentials → validate 302 + clal cookie
 * 3. Follow redirects → acquire IP-bound session cookies (_t, userId)
 */
export async function loginSega(
  config: SegaAuthConfig,
  segaId: string,
  password: string
): Promise<string> {
  const loginPage = await fetch(buildLoginPageUrl(config), {
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

  const baseOrigin = new URL(config.redirectUrl).origin;
  if (!location.includes(baseOrigin)) {
    throw new GameError('unexpected login redirect', 'UNEXPECTED_REDIRECT', 500);
  }

  const clal = findCookie(loginRes.headers.getSetCookie(), 'clal');
  if (!clal) {
    throw new GameError('login succeeded but no session cookie returned', 'NO_SESSION_COOKIE', 500);
  }

  const initialCookie = mergeCookies(preCookies, loginRes.headers.getSetCookie());
  const final = await followRedirects(location, initialCookie);

  const allowed = new Set(config.allowedCookies);
  const finalMap = parseCookies(final.cookie);
  return Array.from(finalMap.entries())
    .filter(([k]) => allowed.has(k))
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

/**
 * Exchanges a long-lived 'clal' token for fresh, IP-bound session cookies.
 */
export async function refreshSegaSession(
  config: SegaAuthConfig,
  clalCookie: string
): Promise<string> {
  const clalMap = parseCookies(clalCookie);
  const clal = clalMap.get('clal');
  if (!clal) {
    throw new AuthError('clal token not found in cookie');
  }

  const response = await fetch(buildLoginPageUrl(config), {
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

  const refreshAllowed = config.allowedCookies.filter((c) => c !== 'clal');
  const allowed = new Set(refreshAllowed);
  const finalMap = parseCookies(final.cookie);
  return Array.from(finalMap.entries())
    .filter(([k]) => allowed.has(k))
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}
