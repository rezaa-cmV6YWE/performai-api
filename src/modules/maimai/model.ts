import { z } from 'zod';

export const serverParams = z.object({
  server: z.enum(['intl', 'jp', 'cn']),
});

export const loginBody = z.object({
  segaId: z.string().min(1),
  password: z.string().min(1),
});

export const cookieHeaders = z.object({
  'x-maimai-cookie': z.string().min(1),
});
