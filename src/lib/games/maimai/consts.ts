import { SEGA_AUTH_GATEWAY_URL } from '@/lib/shared/consts';

export { DEFAULT_HEADERS, MAX_REDIRECTS, USER_AGENT } from '@/lib/shared/consts';

export const MAIMAI_URLS = {
  intl: 'https://maimaidx-eng.com/maimai-mobile',
  jp: 'https://maimaidx.jp/maimai-mobile',
  cn: 'https://maimai.wahlap.com/maimai-mobile',
} as const;

export type MaimaiServer = keyof typeof MAIMAI_URLS;

export const MAIMAI_AUTH_GATEWAY_URL = SEGA_AUTH_GATEWAY_URL;
export const MAIMAI_BACK_URL = 'https://maimai.sega.com/';

export const OTOGEDB_INTL_URL =
  'https://raw.githubusercontent.com/zvuc/otoge-db/master/maimai/data/music-ex-intl.json';

export type Difficulty = 'basic' | 'advanced' | 'expert' | 'master' | 'remaster';

export const DIFFICULTIES: readonly Difficulty[] = [
  'basic',
  'advanced',
  'expert',
  'master',
  'remaster',
] as const;

export const DIFFICULTY_MAP: Record<string, Difficulty> = {
  bas: 'basic',
  adv: 'advanced',
  exp: 'expert',
  mas: 'master',
  remas: 'remaster',
};

export const DIFFICULTY_SELECTORS: Record<number, string> = {
  0: '.music_basic_score_back',
  1: '.music_advanced_score_back',
  2: '.music_expert_score_back',
  3: '.music_master_score_back',
  4: '.music_remaster_score_back',
};

/**
 * Maps major version prefixes from otoge-db (e.g. "100", "200") to non-negative sequential integers.
 * Classic era (maimai -> FiNALE): 0 - 12
 * DX era (DX -> CiRCLE PLUS): 13 - 26
 */
export const VERSION_MAJOR_MAP: Record<number, number> = {
  100: 0, // maimai
  110: 1, // maimai PLUS
  120: 2, // GreeN
  130: 3, // GreeN PLUS
  140: 4, // ORANGE
  150: 5, // ORANGE PLUS
  160: 6, // PiNK
  170: 7, // PiNK PLUS
  180: 8, // MURASAKi
  185: 9, // MURASAKi PLUS
  190: 10, // MiLK
  195: 11, // MiLK PLUS
  199: 12, // FiNALE
  200: 13, // でらっくす (DX)
  205: 14, // でらっくす PLUS
  210: 15, // Splash
  215: 16, // Splash PLUS
  220: 17, // UNiVERSE
  225: 18, // UNiVERSE PLUS
  230: 19, // FESTiVAL
  235: 20, // FESTiVAL PLUS
  240: 21, // BUDDiES
  245: 22, // BUDDiES PLUS
  250: 23, // PRiSM
  255: 24, // PRiSM PLUS
  260: 25, // CiRCLE
  265: 26, // CiRCLE PLUS
};

export const MAIMAI_AP_BONUS_MIN_VERSION = 25; // CiRCLE (260)
export const MAIMAI_TWO_VERSION_NEW_THRESHOLD = 25; // CiRCLE (260)
export const MAIMAI_KIWAMI_MIN_VERSION = 26; // CiRCLE PLUS (265)
export const MAIMAI_DEFAULT_VERSION = 26; // CiRCLE PLUS (265)

export const FC_ICON_FILES: Record<string, string | undefined> = {
  none: undefined,
  fc: 'fc',
  'fc+': 'fcp',
  ap: 'ap',
  'ap+': 'app',
};

export const FS_ICON_FILES: Record<string, string | undefined> = {
  none: undefined,
  fs: 'fs',
  'fs+': 'fsp',
  fdx: 'fsd',
  'fdx+': 'fsdp',
  sync: 'sync',
};

export const RATING_BADGE_THRESHOLDS = [
  { minRating: 15000, name: 'rainbow' },
  { minRating: 14500, name: 'platinum' },
  { minRating: 14000, name: 'gold' },
  { minRating: 13000, name: 'silver' },
  { minRating: 12000, name: 'bronze' },
  { minRating: 10000, name: 'purple' },
  { minRating: 7000, name: 'red' },
  { minRating: 4000, name: 'orange' },
  { minRating: 2000, name: 'green' },
  { minRating: 1, name: 'blue' },
] as const;
