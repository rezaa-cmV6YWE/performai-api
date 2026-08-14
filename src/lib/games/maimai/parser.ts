import { load } from 'cheerio';

import { MAIMAI_URLS, type MaimaiServer } from '@/lib/games/maimai/consts';
import type { MaimaiProfile } from '@/lib/games/maimai/schemas';

export function parseProfile(html: string, server: MaimaiServer): MaimaiProfile {
  const $ = load(html);
  const block = $('.see_through_block');

  if (block.length === 0) {
    throw new Error('player page did not contain expected profile content');
  }

  const nameElement = block.find('.name_block');
  if (nameElement.length === 0) {
    throw new Error('could not find .name_block in player data');
  }
  const name = nameElement.text().trim();

  const ratingElement = block.find('.rating_block');
  if (ratingElement.length === 0) {
    throw new Error('could not find .rating_block in player data');
  }
  const ratingText = ratingElement.text().trim();
  const rating = Number(ratingText);
  if (!Number.isFinite(rating) || rating < 0) {
    throw new Error(`invalid rating format: ${ratingText}`);
  }
  const ratingColor = ratingElement.siblings('img').attr('src');

  const iconElement = block.find('img.w_112');
  const icon = resolveUrl(iconElement.attr('src'), server);

  const titleElement = block.find('.trophy_block');
  const title = titleElement.text().trim() || undefined;
  const titleType = parseTitleType(titleElement.attr('class'));

  const starsMatch = block
    .find('.p_l_10.f_l.f_14')
    .text()
    .trim()
    .match(/[×x](\d+)/);
  const stars = starsMatch ? Number(starsMatch[1]) : undefined;

  const playCountText = block.find('.t_r.f_12').text().trim();
  const playcounts = parsePlayCounts(playCountText);

  const rankElements = block.find('.h_35.f_l');
  const courseRank = resolveUrl(rankElements.eq(0).attr('src'), server);
  const classRank = resolveUrl(rankElements.eq(1).attr('src'), server);

  return {
    name,
    rating: { value: rating, color: ratingColor },
    icon,
    title: {
      value: title,
      typeUrl: `${MAIMAI_URLS.intl}/img/trophy_${titleType}.png`,
      type: titleType,
    },
    stars,
    playCount: {
      ...playcounts,
    },
    courseRank,
    classRank,
  };
}

export function parseActiveCollection(html: string, server: MaimaiServer): string | undefined {
  const $ = load(html);
  const block = $('.town_block.m_15.p_15.t_l');

  if (block.length === 0) {
    throw new Error('collection page did not contain expected content');
  }

  const activeCollectionElement = block.find('.w_396.m_r_10');
  if (activeCollectionElement.length === 0) {
    throw new Error('could not find active collection image in collections data');
  }
  const activeCollectionSrc = activeCollectionElement.attr('src');

  return resolveUrl(activeCollectionSrc, server);
}

function resolveUrl(src: string | undefined, server: MaimaiServer): string | undefined {
  if (!src) return undefined;
  const origin = new URL(MAIMAI_URLS[server]).origin;
  return src.startsWith('http') ? src : `${origin}${src}`;
}

function parseTitleType(className: string | undefined): MaimaiProfile['title']['type'] {
  if (!className) return undefined;
  if (className.includes('trophy_Rainbow')) return 'rainbow';
  if (className.includes('trophy_Gold')) return 'gold';
  if (className.includes('trophy_Silver')) return 'silver';
  if (className.includes('trophy_Bronze')) return 'bronze';
  if (className.includes('trophy_Normal')) return 'normal';
  return undefined;
}

function parsePlayCounts(text: string): {
  versionPlayCount: number | undefined;
  totalPlayCount: number | undefined;
} {
  const versionMatch = text.match(/play count of current version[:：]\s*([\d,]+)/);
  const totalMatch = text.match(/maimaiDX total play count[:：]\s*([\d,]+)/);

  return {
    versionPlayCount: versionMatch ? Number(versionMatch[1].replace(/,/g, '')) : undefined,
    totalPlayCount: totalMatch ? Number(totalMatch[1].replace(/,/g, '')) : undefined,
  };
}
