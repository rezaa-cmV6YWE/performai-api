import { z } from 'zod';

export const errorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export function success<T>(data: T) {
  return { data };
}

export function error(code: string, message: string) {
  return { error: { code, message } };
}

export function successSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    data: dataSchema,
  });
}
