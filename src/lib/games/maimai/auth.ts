import { MAIMAI_BACK_URL, MAIMAI_URLS } from '@/lib/games/maimai/consts';
import type { SegaAuthConfig } from '@/lib/shared/sega-auth';
import { loginSega, refreshSegaSession } from '@/lib/shared/sega-auth';

const MAIMAI_AUTH_CONFIG: SegaAuthConfig = {
  siteId: 'maimaidxex',
  redirectUrl: `${MAIMAI_URLS.intl}/`,
  backUrl: MAIMAI_BACK_URL,
  allowedCookies: ['clal', '_t', 'userId', 'AWSALBTG', 'AWSALBTGCORS'],
};

export function loginMaimaiIntl(segaId: string, password: string): Promise<string> {
  return loginSega(MAIMAI_AUTH_CONFIG, segaId, password);
}

/**
 * Exchanges a long-lived 'clal' token for fresh, IP-bound session cookies ('_t', 'userId').
 * This is crucial for Cloudflare Workers where the outbound IP changes per request.
 */
export function refreshSession(clalCookie: string): Promise<string> {
  return refreshSegaSession(MAIMAI_AUTH_CONFIG, clalCookie);
}
