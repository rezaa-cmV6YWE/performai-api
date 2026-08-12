import { z } from 'zod';

export const serverSchema = z.object({
  server: z.enum(['intl', 'jp', 'cn']),
});

export const loginBodySchema = z.object({
  segaId: z.string().min(1),
  password: z.string().min(1),
});

export const profileHeaderSchema = z.object({
  'x-game-cookie': z.string().min(1),
});

export const MaimaiProfile = z.object({
  name: z.string().optional(),
  rating: z.object({
    value: z.number().int().nonnegative(),
    color: z.string().url().optional(),
  }),
  icon: z.string().url().optional(),
  title: z.object({
    value: z.string().optional(),
    typeUrl: z.string().url().optional(),
    type: z.enum(['rainbow', 'gold', 'silver', 'bronze', 'normal']).optional(),
  }),
  stars: z.number().int().nonnegative().optional(),
  playCount: z.object({
    versionPlayCount: z.number().int().nonnegative().optional(),
    totalPlayCount: z.number().int().nonnegative().optional(),
  }),
  courseRank: z.string().url().optional(),
  classRank: z.string().url().optional(),
});

export type MaimaiProfile = z.infer<typeof MaimaiProfile>;
