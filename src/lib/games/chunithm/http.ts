import { CHUNITHM_URLS } from '@/lib/games/chunithm/consts';
import { followRedirects } from '@/lib/shared/http';

const REFERER = `${CHUNITHM_URLS.intl}/`;

export async function chunithmFetch(
  url: string,
  cookie: string,
  init: RequestInit = {}
): Promise<Response> {
  const result = await followRedirects(url, cookie, {
    ...init,
    checkAuthRedirect: true,
    headers: {
      Referer: REFERER,
      ...init.headers,
    },
  });

  return result.response;
}
