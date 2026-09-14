export const CHUNITHM_URLS = {
  intl: 'https://chunithm-net-eng.com/mobile',
} as const;

export type ChunithmServer = keyof typeof CHUNITHM_URLS;

export const CHUNITHM_BACK_URL = 'https://chunithm.sega.com/';

export const OTOGEDB_INTL_URL =
  'https://raw.githubusercontent.com/zvuc/otoge-db/master/chunithm/data/music-ex-intl.json';

export type Difficulty = 'basic' | 'advanced' | 'expert' | 'master' | 'ultima';

export const DIFFICULTIES: readonly Difficulty[] = [
  'basic',
  'advanced',
  'expert',
  'master',
  'ultima',
] as const;

export const DIFF_INDEX_MAP: Record<number, Difficulty> = {
  0: 'basic',
  1: 'advanced',
  2: 'expert',
  3: 'master',
  4: 'ultima',
};

export const DIFF_KEY_MAP: Record<Difficulty, { displayKey: string; internalKey: string }> = {
  basic: { displayKey: 'lev_bas', internalKey: 'lev_bas_i' },
  advanced: { displayKey: 'lev_adv', internalKey: 'lev_adv_i' },
  expert: { displayKey: 'lev_exp', internalKey: 'lev_exp_i' },
  master: { displayKey: 'lev_mas', internalKey: 'lev_mas_i' },
  ultima: { displayKey: 'lev_ult', internalKey: 'lev_ult_i' },
};
