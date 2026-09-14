export const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export const DEFAULT_HEADERS = {
  'User-Agent': USER_AGENT,
} as const;

export const MAX_REDIRECTS = 5;

/** Common gateway used by SEGA Aime games (maimai, chunithm, ongeki) */
export const SEGA_AUTH_GATEWAY_URL = 'https://lng-tgk-aime-gw.am-all.net/common_auth';
