import type { GameProfile } from '@/lib/games/base';
import { load } from 'cheerio';

export function parseProfile(html: string): GameProfile {
  const $ = load(html);

  const name = $('.name_block').first().text().trim() || null;
  const ratingText = $('.rating_block').first().text().trim();
  const rating = ratingText ? Number(ratingText) : null;

  return { name, rating };
}
