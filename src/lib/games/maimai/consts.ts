export const MAIMAI_URLS = {
  intl: 'https://maimaidx-eng.com/maimai-mobile',
  jp: 'https://maimaidx.jp/maimai-mobile',
  cn: 'https://maimai.wahlap.com/maimai-mobile',
} as const;

export const MAIMAI_AUTH_GATEWAY_URL = 'https://lng-tgk-aime-gw.am-all.net/common_auth';

export const MAIMAI_BACK_URL = 'https://maimai.sega.com/';

export type MaimaiServer = keyof typeof MAIMAI_URLS;
