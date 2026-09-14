import { load } from 'cheerio';

import { ParseError } from '@/lib/errors';
import { CHUNITHM_URLS, type ChunithmServer } from '@/lib/games/chunithm/consts';
import type { ChunithmProfile } from '@/lib/games/chunithm/schemas';

function resolveUrl(src: string | undefined | null, server: ChunithmServer): string | null {
  if (!src) return null;
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  const origin = new URL(CHUNITHM_URLS[server]).origin;
  return `${origin}${src.startsWith('/') ? '' : '/'}${src}`;
}

export function parseProfile(html: string, server: ChunithmServer): ChunithmProfile {
  const $ = load(html);
  const block = $('.box_playerprofile');

  if (block.length === 0) {
    throw new ParseError('player page did not contain expected profile content');
  }

  // Name
  const formLink = block.find('.player_name_in form a');
  const name =
    (formLink.length > 0 ? formLink.text() : block.find('.player_name_in').text()).trim() || null;

  // Friend Code
  const friendCodeSpan = $('.user_data_friend_code .user_data_text span:not(.font_90)');
  const friendCodeForm = block.find('.player_name_in form input[name=idx]');
  const friendCode =
    friendCodeSpan.text().trim() || friendCodeForm.val()?.toString().trim() || null;

  // Level
  const levelText = block.find('.player_lv').text().trim();
  const level = levelText ? Number(levelText.replace(/,/g, '')) : null;

  // Reborn (stars)
  const rebornElem = block.find('.player_reborn');
  const reborn = rebornElem.length > 0 ? Number(rebornElem.text().trim().replace(/,/g, '')) : 0;

  // Rating
  const ratingImgs = block.find('.player_rating_num_block img');
  if (ratingImgs.length === 0) {
    throw new ParseError('could not find rating images in player data');
  }

  let ratingStr = '';
  let ratingColor: string | null = null;
  const ratingImages: string[] = [];

  ratingImgs.each((_, el) => {
    const src = $(el).attr('src') || '';
    const resolved = resolveUrl(src, server);
    if (resolved) {
      ratingImages.push(resolved);
    }

    const filename = src.split('/').pop()?.split('.')[0] || '';
    const parts = filename.split('_');
    if (!ratingColor && parts.length >= 2 && parts[0] === 'rating') {
      ratingColor = parts[1];
    }

    if (filename.includes('comma')) {
      ratingStr += '.';
    } else {
      const lastPart = parts[parts.length - 1];
      const digit = lastPart ? lastPart.slice(-1) : '';
      if (/\d/.test(digit)) {
        ratingStr += digit;
      }
    }
  });

  if (!ratingStr) {
    throw new ParseError('invalid rating format: empty rating digits');
  }

  const ratingValue = Number(ratingStr);
  if (!Number.isFinite(ratingValue) || ratingValue < 0) {
    throw new ParseError(`invalid rating format: ${ratingStr}`);
  }

  const rating = {
    value: ratingValue,
    color: ratingColor,
    images: ratingImages,
  };

  // Highest Rating
  const maxRatingText = block.find('.player_rating_max').text().trim();
  const highestRating = maxRatingText ? Number(maxRatingText) : null;

  // Overpower
  const overpowerText = block.find('.player_overpower_text').text().trim();
  let overpower = null;
  const opMatch = overpowerText.match(/([\d.]+)\s*\(([\d.]+)%\)/);
  if (opMatch) {
    overpower = {
      value: parseFloat(opMatch[1]),
      percentage: parseFloat(opMatch[2]),
    };
  }

  // Titles
  const titles: NonNullable<ChunithmProfile['titles']> = [];
  block.find('.player_honor_short').each((_, el) => {
    const style = $(el).attr('style') || '';
    const match = style.match(/url\(['"]?([^'"]+?)['"]?\)/i);
    const bgUrl = match ? resolveUrl(match[1], server) : null;
    const textElem = $(el)
      .find('.player_honor_text span, .honor_now_text span, .player_honor_text, .honor_now_text')
      .first();
    const text = textElem.text().trim() || null;

    if (!bgUrl && !text) return;

    let type: string | null = null;
    if (bgUrl) {
      const filename = bgUrl.split('/').pop()?.split('?')[0]?.split('.')[0] || '';
      if (filename.startsWith('honor_bg_')) {
        const rarity = filename.slice('honor_bg_'.length);
        if (rarity === 'noSet') return;
        type = rarity;
      }
    }

    titles.push({
      value: text,
      type,
      typeUrl: bgUrl,
    });
  });

  // Character & Frame
  const charImgSrc = block.find('.player_chara img').attr('src') || null;
  const characterImage = resolveUrl(charImgSrc, server);

  const charFrameStyle = block.find('.player_chara').attr('style') || '';
  const frameMatch = charFrameStyle.match(/url\(['"]?([^'"]+)['"]?\)/i);
  const characterFrame = frameMatch ? resolveUrl(frameMatch[1], server) : null;

  const character =
    characterImage || characterFrame
      ? {
          image: characterImage,
          frame: characterFrame,
        }
      : null;

  // Team
  const teamName = block.find('.player_team_name').text().trim() || null;
  const emblemElem = block.find('[class*="player_team_emblem_"]');
  let emblem: string | null = null;
  let emblemUrl: string | null = null;
  if (emblemElem.length > 0) {
    const classList = (emblemElem.attr('class') || '').split(/\s+/);
    const emblemClass = classList.find((c) => c.startsWith('player_team_emblem_'));
    if (emblemClass) {
      emblem = emblemClass.replace('player_team_emblem_', '');
    }

    const inlineStyle = emblemElem.attr('style') || '';
    const styleMatch = inlineStyle.match(/url\(['"]?([^'"]+?)['"]?\)/i);
    if (styleMatch) {
      emblemUrl = resolveUrl(styleMatch[1], server);
    } else if (emblem) {
      emblemUrl = `${CHUNITHM_URLS[server]}/images/team_bg_${emblem}_mini.png`;
    }
  }
  const team =
    teamName || emblem || emblemUrl
      ? {
          name: teamName,
          emblem,
          emblemUrl,
        }
      : null;

  // Play Count
  const currentPlayCountText = $('.user_data_current_play_count .user_data_text').text().trim();
  const totalPlayCountText = $('.user_data_play_count .user_data_text').text().trim();

  const versionPlayCount = currentPlayCountText
    ? Number(currentPlayCountText.replace(/,/g, ''))
    : null;
  const totalPlayCount = totalPlayCountText ? Number(totalPlayCountText.replace(/,/g, '')) : null;

  const playCount =
    versionPlayCount !== null || totalPlayCount !== null
      ? {
          versionPlayCount,
          totalPlayCount,
        }
      : null;

  // Currency
  const ownedText = $('.user_data_point .user_data_text').text().trim();
  const totalText = $('.user_data_total_point .user_data_text').text().trim();
  const currency =
    ownedText || totalText
      ? {
          owned: ownedText ? Number(ownedText.replace(/,/g, '')) : null,
          total: totalText ? Number(totalText.replace(/,/g, '')) : null,
        }
      : null;

  return {
    name,
    friendCode,
    level,
    reborn,
    rating,
    highestRating,
    overpower,
    titles,
    character,
    team,
    playCount,
    currency,
  };
}

export function parseActiveCollection(html: string, server: ChunithmServer): string | null {
  const $ = load(html);
  const nameplateContainer = $('.nameplate_now');

  if (nameplateContainer.length === 0) {
    throw new ParseError('collection page did not contain expected content');
  }

  const nameplateSrc = nameplateContainer.find('img').attr('src');
  return resolveUrl(nameplateSrc, server);
}
