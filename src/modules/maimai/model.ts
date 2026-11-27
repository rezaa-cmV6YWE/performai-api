import { Elysia } from 'elysia';
import { z } from 'zod';

export const MaimaiProfile = z.object({
  name: z.string().nullable().optional(),
  rating: z.object({
    value: z.number().int().nonnegative(),
    color: z.url().nullable().optional(),
  }),
  icon: z.url().nullable().optional(),
  title: z.object({
    value: z.string().nullable().optional(),
    typeUrl: z.url().nullable().optional(),
    type: z.enum(['rainbow', 'gold', 'silver', 'bronze', 'normal']).nullable().optional(),
  }),
  stars: z.number().int().nonnegative().nullable().optional(),
  playCount: z.object({
    versionPlayCount: z.number().int().nonnegative().nullable().optional(),
    totalPlayCount: z.number().int().nonnegative().nullable().optional(),
  }),
  courseRank: z.url().nullable().optional(),
  classRank: z.url().nullable().optional(),
});

export type MaimaiProfile = z.infer<typeof MaimaiProfile>;

export const Circle = z
  .object({
    name: z.string().nullable().optional(),
    class: z.url().nullable().optional(),
  })
  .nullable()
  .optional();

export type Circle = z.infer<typeof Circle>;

export const MaimaiProfileExtended = MaimaiProfile.extend({
  nameplate: z.url().nullable().optional(),
  frame: z.url().nullable().optional(),
  circle: Circle,
});

export type MaimaiProfileExtended = z.infer<typeof MaimaiProfileExtended>;

export const MaimaiRatingSong = z.object({
  name: z.string(),
  type: z.enum(['std', 'dx']),
  difficulty: z.enum(['basic', 'advanced', 'expert', 'master', 'remaster']),
  level: z.string(),
  internalLevel: z.number(),
  achievement: z.number(),
  dxScore: z.number(),
  rating: z.number().int(),
  jacket: z.url().nullable(),
  combo: z.object({
    type: z.string().nullable(),
    image: z.url().nullable(),
  }),
  sync: z.object({
    type: z.string().nullable(),
    image: z.url().nullable(),
  }),
});

export type MaimaiRatingSong = z.infer<typeof MaimaiRatingSong>;

export const MaimaiRating = z.object({
  rating: z.number().int(),
  newRatingSongs: z.array(MaimaiRatingSong),
  oldRatingSongs: z.array(MaimaiRatingSong),
});

export type MaimaiRating = z.infer<typeof MaimaiRating>;

export const MaimaiServerParams = z.object({
  server: z.enum(['intl', 'jp', 'cn']),
});

export type MaimaiServerParams = z.infer<typeof MaimaiServerParams>;

export const MaimaiCookieHeaders = z.object({
  'x-maimai-cookie': z.string().min(1),
});

export type MaimaiCookieHeaders = z.infer<typeof MaimaiCookieHeaders>;

export const MaimaiProfileResponse = z.object({ data: MaimaiProfileExtended });

export type MaimaiProfileResponse = z.infer<typeof MaimaiProfileResponse>;

export const MaimaiRatingResponse = z.object({ data: MaimaiRating });

export type MaimaiRatingResponse = z.infer<typeof MaimaiRatingResponse>;

export const maimaiModel = new Elysia({ name: 'maimai.model' }).model({
  MaimaiProfileResponse,
  MaimaiRatingResponse,
});
