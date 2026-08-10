import { AuthError, GameError } from '@/lib/errors';
import { mergeCookies } from '@/lib/games/maimai/cookies';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const MAX_REDIRECTS = 5;

function isRedirect(status: number): boolean {
  return [301, 302, 303, 307, 308].includes(status);
}

export async function maimaiFetch(
  url: string,
  cookie: string,
  init: RequestInit = {}
): Promise<Response> {
  let currentUrl = url;
  let currentCookie = cookie;
  let redirects = 0;
  let currentInit = init;

  while (true) {
    const res = await fetch(currentUrl, {
      ...currentInit,
      headers: {
        'User-Agent': USER_AGENT,
        Cookie: currentCookie,
        Referer: 'https://maimaidx-eng.com/maimai-mobile/home/',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        ...currentInit.headers,
      },
      redirect: 'manual',
    });

    if (!isRedirect(res.status)) {
      return res;
    }

    if (redirects >= MAX_REDIRECTS) {
      throw new GameError('too many redirects', 'TOO_MANY_REDIRECTS', 500);
    }

    const location = res.headers.get('location');
    if (!location) {
      return res;
    }

    if (location.includes('/common_auth/login')) {
      throw new AuthError('session expired or invalid');
    }

    currentCookie = mergeCookies(currentCookie, res.headers.get('set-cookie'));
    currentUrl = new URL(location, currentUrl).toString();
    redirects++;

    // 302/303 redirects typically become GET; preserve only safe method/body for 307/308
    if (res.status !== 307 && res.status !== 308) {
      currentInit = { ...currentInit, method: 'GET', body: undefined };
    }
  }
}
