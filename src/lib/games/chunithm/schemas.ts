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

export const ChunithmRating = z.object({
  value: z.number().nonnegative(),
  color: z.string().nullable().optional(),
  images: z.array(z.url()).nullable().optional(),
});

export type ChunithmRating = z.infer<typeof ChunithmRating>;

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
  rating: ChunithmRating,
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
