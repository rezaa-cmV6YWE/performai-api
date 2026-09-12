import { AuthError, GameError } from '@/lib/errors';
import { DEFAULT_HEADERS, MAIMAI_URLS, MAX_REDIRECTS } from '@/lib/games/maimai/consts';
import { mergeCookies } from '@/lib/games/maimai/cookies';

const REFERER = `${MAIMAI_URLS.intl}/home/`;

export interface FetchWithRedirectsOptions extends RequestInit {
  maxRedirects?: number;
  checkAuthRedirect?: boolean;
}

export interface RedirectResult {
  url: string;
  cookie: string;
  response: Response;
}

function isRedirect(status: number): boolean {
  return [301, 302, 303, 307, 308].includes(status);
}

export async function followRedirects(
  startUrl: string,
  startCookie: string,
  options: FetchWithRedirectsOptions = {}
): Promise<RedirectResult> {
  const {
    maxRedirects = MAX_REDIRECTS,
    checkAuthRedirect = false,
    headers: customHeaders,
    ...restInit
  } = options;

  let currentUrl = startUrl;
  let currentCookie = startCookie;
  let redirects = 0;
  let currentInit: RequestInit = { ...restInit, headers: customHeaders };

  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const res = await fetch(currentUrl, {
      ...currentInit,
      headers: {
        ...DEFAULT_HEADERS,
        Cookie: currentCookie,
        ...currentInit.headers,
      },
      redirect: 'manual',
    });

    if (!isRedirect(res.status)) {
      return { url: currentUrl, cookie: currentCookie, response: res };
    }

    if (redirects >= maxRedirects) {
      throw new GameError('too many redirects', 'TOO_MANY_REDIRECTS', 500);
    }

    const location = res.headers.get('location');
    if (!location) {
      return { url: currentUrl, cookie: currentCookie, response: res };
    }

    if (
      checkAuthRedirect &&
      (location.includes('/common_auth/login') || location.includes('/error'))
    ) {
      throw new AuthError('session expired or invalid');
    }

    currentCookie = mergeCookies(currentCookie, res.headers.get('set-cookie'));
    currentUrl = new URL(location, currentUrl).toString();
    redirects++;

    if (res.status !== 307 && res.status !== 308) {
      currentInit = { ...currentInit, method: 'GET', body: undefined };
    }
  }
}

export async function maimaiFetch(
  url: string,
  cookie: string,
  init: RequestInit = {}
): Promise<Response> {
  const result = await followRedirects(url, cookie, {
    ...init,
    checkAuthRedirect: true,
    headers: {
      Referer: REFERER,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      ...init.headers,
    },
  });

  return result.response;
}
