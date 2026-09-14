export const CHUNITHM_URLS = {
  intl: 'https://chunithm-net-eng.com/mobile',
} as const;

export type ChunithmServer = keyof typeof CHUNITHM_URLS;

export const CHUNITHM_BACK_URL = 'https://chunithm.sega.com/';
