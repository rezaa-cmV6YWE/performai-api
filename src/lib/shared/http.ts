import { AuthError, GameError } from '@/lib/errors';
import { DEFAULT_HEADERS, MAX_REDIRECTS } from '@/lib/shared/consts';
import { mergeCookies } from '@/lib/shared/cookies';

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
    // oxlint-disable-next-line no-await-in-loop
    const res = await fetch(currentUrl, {
      ...currentInit,
      headers: {
        ...DEFAULT_HEADERS,
        ...(currentCookie ? { Cookie: currentCookie } : {}),
        ...currentInit.headers,
      },
      redirect: 'manual',
    });

    if (!isRedirect(res.status)) {
      currentCookie = mergeCookies(currentCookie, res.headers.getSetCookie());
      return { url: currentUrl, cookie: currentCookie, response: res };
    }

    if (redirects >= maxRedirects) {
      throw new GameError('too many redirects', 'TOO_MANY_REDIRECTS', 500);
    }

    const location = res.headers.get('location');
    if (!location) {
      currentCookie = mergeCookies(currentCookie, res.headers.getSetCookie());
      return { url: currentUrl, cookie: currentCookie, response: res };
    }

    if (
      checkAuthRedirect &&
      (location.includes('/common_auth/login') || location.includes('/error'))
    ) {
      throw new AuthError('session expired or invalid');
    }

    currentCookie = mergeCookies(currentCookie, res.headers.getSetCookie());
    currentUrl = new URL(location, currentUrl).toString();
    redirects++;

    if (res.status !== 307 && res.status !== 308) {
      currentInit = { ...currentInit, method: 'GET', body: undefined };
    }
  }
}
