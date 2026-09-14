import { z } from 'zod';

export const ChunithmTitle = z.object({
  value: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  typeUrl: z.url().nullable().optional(),
});

export type ChunithmTitle = z.infer<typeof ChunithmTitle>;

export const ChunithmCharacter = z.object({
  image: z.url().nullable().optional(),
  frame: z.url().nullable().optional(),
});

export type ChunithmCharacter = z.infer<typeof ChunithmCharacter>;

export const ChunithmProfileRating = z.object({
  value: z.number().nonnegative(),
  color: z.string().nullable().optional(),
  images: z.array(z.url()).nullable().optional(),
});

export type ChunithmProfileRating = z.infer<typeof ChunithmProfileRating>;

export const ChunithmPlayCount = z.object({
  versionPlayCount: z.number().int().nonnegative().nullable().optional(),
  totalPlayCount: z.number().int().nonnegative().nullable().optional(),
});

export type ChunithmPlayCount = z.infer<typeof ChunithmPlayCount>;

export const ChunithmProfile = z.object({
  name: z.string().nullable().optional(),
  friendCode: z.string().nullable().optional(),
  level: z.number().int().nonnegative().nullable().optional(),
  reborn: z.number().int().nonnegative().nullable().optional(),
  rating: ChunithmProfileRating,
  highestRating: z.number().nonnegative().nullable().optional(),
  overpower: z
    .object({
      value: z.number().nonnegative(),
      percentage: z.number().nonnegative(),
    })
    .nullable()
    .optional(),
  titles: z.array(ChunithmTitle).nullable().optional(),
  character: ChunithmCharacter.nullable().optional(),
  team: z
    .object({
      name: z.string().nullable().optional(),
      emblem: z.string().nullable().optional(),
      emblemUrl: z.url().nullable().optional(),
    })
    .nullable()
    .optional(),
  playCount: ChunithmPlayCount.nullable().optional(),
  currency: z
    .object({
      owned: z.number().int().nonnegative().nullable().optional(),
      total: z.number().int().nonnegative().nullable().optional(),
    })
    .nullable()
    .optional(),
});

export type ChunithmProfile = z.infer<typeof ChunithmProfile>;

export const ChunithmProfileExtended = ChunithmProfile.extend({
  nameplate: z.url().nullable().optional(),
});

export type ChunithmProfileExtended = z.infer<typeof ChunithmProfileExtended>;

export const ChunithmDifficulty = z.enum(['basic', 'advanced', 'expert', 'master', 'ultima']);

export type ChunithmDifficulty = z.infer<typeof ChunithmDifficulty>;

export const ChunithmRatingSong = z.object({
  id: z.string(),
  title: z.string(),
  difficulty: ChunithmDifficulty,
  level: z.string().nullable().optional(),
  internalLevel: z.number().nullable().optional(),
  score: z.number().int().nonnegative(),
  rating: z.number().nonnegative(),
  jacket: z.url().nullable().optional(),
  combo: z.object({
    type: z.string().nullable(),
    image: z.url().nullable(),
  }),
  chain: z.object({
    type: z.string().nullable(),
    image: z.url().nullable(),
  }),
});

export type ChunithmRatingSong = z.infer<typeof ChunithmRatingSong>;

export const ChunithmRating = z.object({
  rating: z.number().nonnegative(),
  newRatingSongs: z.array(ChunithmRatingSong),
  oldRatingSongs: z.array(ChunithmRatingSong),
});

export type ChunithmRating = z.infer<typeof ChunithmRating>;

export const ChunithmRatingData = ChunithmRating;
export type ChunithmRatingData = ChunithmRating;
