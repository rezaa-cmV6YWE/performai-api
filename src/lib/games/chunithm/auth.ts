import { CHUNITHM_BACK_URL, CHUNITHM_URLS } from '@/lib/games/chunithm/consts';
import type { SegaAuthConfig } from '@/lib/shared/sega-auth';
import { ensureSegaSession, loginSega } from '@/lib/shared/sega-auth';

const CHUNITHM_AUTH_CONFIG: SegaAuthConfig = {
  siteId: 'chuniex',
  redirectUrl: `${CHUNITHM_URLS.intl}/`,
  backUrl: CHUNITHM_BACK_URL,
  allowedCookies: ['clal', '_t', 'userId', 'AWSALBTG', 'AWSALBTGCORS'],
};

export function loginChunithmIntl(segaId: string, password: string): Promise<string> {
  return loginSega(CHUNITHM_AUTH_CONFIG, segaId, password);
}

export function ensureChunithmSession(cookie: string): Promise<string> {
  return ensureSegaSession(CHUNITHM_AUTH_CONFIG, cookie);
}
