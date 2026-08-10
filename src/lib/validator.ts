import { error } from '@/lib/response';
import { zValidator } from '@hono/zod-validator';
import type { ValidationTargets } from 'hono';
import type { z } from 'zod';

export function validator<T extends z.ZodTypeAny>(target: keyof ValidationTargets, schema: T) {
  return zValidator(target, schema, (result, c) => {
    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ');
      return c.json(error('VALIDATION_ERROR', message), 400);
    }
  });
}
