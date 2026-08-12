import { AuthError, GameError } from '@/lib/errors';
import { MAIMAI_AUTH_GATEWAY_URL, MAIMAI_BACK_URL, MAIMAI_URLS } from '@/lib/games/maimai/consts';
import { cookieBag, findCookie, mergeCookies } from '@/lib/games/maimai/cookies';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const LOGIN_PAGE_URL = `${MAIMAI_AUTH_GATEWAY_URL}/login?site_id=maimaidxex&redirect_url=${encodeURIComponent(`${MAIMAI_URLS.intl}/`)}&back_url=${MAIMAI_BACK_URL}`;

const LOGIN_POST_URL = `${MAIMAI_AUTH_GATEWAY_URL}/login/sid`;

function isRedirect(status: number): boolean {
  return [301, 302, 303, 307, 308].includes(status);
}

async function followRedirects(
  startUrl: string,
  startCookie: string,
  init: RequestInit = {}
): Promise<{ url: string; cookie: string; response: Response }> {
  let url = startUrl;
  let cookie = startCookie;
  let currentInit = init;
  let redirects = 0;

  while (true) {
    const res = await fetch(url, {
      ...currentInit,
      headers: {
        'User-Agent': USER_AGENT,
        Cookie: cookie,
        ...currentInit.headers,
      },
      redirect: 'manual',
    });

    if (!isRedirect(res.status)) {
      return { url, cookie, response: res };
    }

    if (redirects >= 5) {
      throw new GameError('too many redirects during login', 'TOO_MANY_REDIRECTS', 500);
    }

    const location = res.headers.get('location');
    if (!location) {
      return { url, cookie, response: res };
    }

    cookie = mergeCookies(cookie, res.headers.get('set-cookie'));
    url = new URL(location, url).toString();
    redirects++;

    if (res.status !== 307 && res.status !== 308) {
      currentInit = { ...currentInit, method: 'GET', body: undefined };
    }
  }
}

export async function loginMaimaiIntl(segaId: string, password: string): Promise<string> {
  const loginPage = await fetch(LOGIN_PAGE_URL, {
    headers: { 'User-Agent': USER_AGENT },
    redirect: 'manual',
  });

  const preCookies = cookieBag(loginPage.headers.get('set-cookie'));

  const body = new URLSearchParams({ sid: segaId, password });
  const loginRes = await fetch(`${LOGIN_POST_URL}?retention=1`, {
    method: 'POST',
    headers: {
      'User-Agent': USER_AGENT,
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

  const clal = findCookie(loginRes.headers.get('set-cookie'), 'clal');
  if (!clal) {
    throw new GameError('login succeeded but no session cookie returned', 'NO_SESSION_COOKIE', 500);
  }

  const cookie = mergeCookies(preCookies, loginRes.headers.get('set-cookie'));
  const final = await followRedirects(location, cookie);

  return final.cookie;
}
