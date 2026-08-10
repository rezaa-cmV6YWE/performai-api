export const MAIMAI_URLS = {
  intl: 'https://maimaidx-eng.com/maimai-mobile',
  jp: 'https://maimaidx.jp/maimai-mobile',
  cn: 'https://maimaidx-eng.com/maimai-mobile',
} as const;

export type MaimaiServer = keyof typeof MAIMAI_URLS;
