import {
  FC_ICON_FILES,
  FS_ICON_FILES,
  MAIMAI_KIWAMI_MIN_VERSION,
  MAIMAI_URLS,
  RATING_BADGE_THRESHOLDS,
} from '@/lib/games/maimai/consts';

export function getJacketUrl(imageUrl: string | undefined): string | null {
  if (!imageUrl) return null;
  return `${MAIMAI_URLS.intl}/img/Music/${imageUrl}`;
}

export function getIconUrl(file: string | undefined): string | null {
  if (!file) return null;
  return `${MAIMAI_URLS.intl}/img/music_icon_${file}.png`;
}

export function getFcImageUrl(fc: string | null): string | null {
  if (!fc || fc === 'none') return null;
  return getIconUrl(FC_ICON_FILES[fc]);
}

export function getFsImageUrl(fs: string | null): string | null {
  if (!fs || fs === 'none') return null;
  return getIconUrl(FS_ICON_FILES[fs]);
}

export function getRatingBadgeUrl(rating: number, currentVersion: number): string | null {
  if (rating >= 16000 && currentVersion >= MAIMAI_KIWAMI_MIN_VERSION) {
    return `${MAIMAI_URLS.intl}/img/rating_kiwami.png`;
  }

  for (const { minRating, name } of RATING_BADGE_THRESHOLDS) {
    if (rating >= minRating) {
      return `${MAIMAI_URLS.intl}/img/rating_${name}.png`;
    }
  }

  return null;
}
