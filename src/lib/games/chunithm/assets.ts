import { CHUNITHM_URLS, type ChunithmServer } from '@/lib/games/chunithm/consts';

export const COMBO_ICON_FILES: Record<string, string | undefined> = {
  fc: 'icon_fullcombo.png',
  aj: 'icon_alljustice.png',
  ajc: 'icon_alljusticecritical.png',
};

export const CHAIN_ICON_FILES: Record<string, string | undefined> = {
  fch: 'icon_fullchain2.png',
  'fch+': 'icon_fullchain.png',
};

export function getJacketUrl(
  image: string | undefined | null,
  server: ChunithmServer = 'intl'
): string | null {
  if (!image) return null;
  return `${CHUNITHM_URLS[server]}/img/${image}`;
}

export function getComboImageUrl(
  combo: string | null | undefined,
  server: ChunithmServer = 'intl'
): string | null {
  if (!combo) return null;
  const file = COMBO_ICON_FILES[combo.toLowerCase()];
  if (!file) return null;
  return `${CHUNITHM_URLS[server]}/images/${file}`;
}

export function getChainImageUrl(
  chain: string | null | undefined,
  server: ChunithmServer = 'intl'
): string | null {
  if (!chain) return null;
  const file = CHAIN_ICON_FILES[chain.toLowerCase()];
  if (!file) return null;
  return `${CHUNITHM_URLS[server]}/images/${file}`;
}
