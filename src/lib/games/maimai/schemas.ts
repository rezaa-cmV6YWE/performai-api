import { z } from 'zod';

export const serverSchema = z.object({
  server: z.enum(['intl', 'jp', 'cn']),
});

export const loginBodySchema = z.object({
  segaId: z.string().min(1),
  password: z.string().min(1),
});

export const profileHeaderSchema = z.object({
  'x-maimai-cookie': z.string().min(1),
});

export const MaimaiProfile = z.object({
  name: z.string().nullable().optional(),
  rating: z.object({
    value: z.number().int().nonnegative(),
    color: z.string().url().nullable().optional(),
  }),
  icon: z.string().url().nullable().optional(),
  title: z.object({
    value: z.string().nullable().optional(),
    typeUrl: z.string().url().nullable().optional(),
    type: z.enum(['rainbow', 'gold', 'silver', 'bronze', 'normal']).nullable().optional(),
  }),
  stars: z.number().int().nonnegative().nullable().optional(),
  playCount: z.object({
    versionPlayCount: z.number().int().nonnegative().nullable().optional(),
    totalPlayCount: z.number().int().nonnegative().nullable().optional(),
  }),
  courseRank: z.string().url().nullable().optional(),
  classRank: z.string().url().nullable().optional(),
});

export type MaimaiProfile = z.infer<typeof MaimaiProfile>;

export const MaimaiProfileExtended = MaimaiProfile.extend({
  nameplate: z.string().url().nullable().optional(),
  frame: z.string().url().nullable().optional(),
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
  jacket: z.string().url().nullable(),
  combo: z.object({
    type: z.string().nullable(),
    image: z.string().url().nullable(),
  }),
  sync: z.object({
    type: z.string().nullable(),
    image: z.string().url().nullable(),
  }),
});

export type MaimaiRatingSong = z.infer<typeof MaimaiRatingSong>;

export const MaimaiRating = z.object({
  rating: z.number().int(),
  ratingImage: z.string().url().nullable(),
  newRatingSongs: z.array(MaimaiRatingSong),
  oldRatingSongs: z.array(MaimaiRatingSong),
});

export type MaimaiRating = z.infer<typeof MaimaiRating>;
