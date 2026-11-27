import { Elysia } from 'elysia';
import { z } from 'zod';

export const ErrorResponse = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export type ErrorResponse = z.infer<typeof ErrorResponse>;

export const LoginBody = z.object({
  segaId: z.string().min(1),
  password: z.string().min(1),
});

export type LoginBody = z.infer<typeof LoginBody>;

export const LoginResponse = z.object({
  data: z.object({ cookie: z.string() }),
});

export type LoginResponse = z.infer<typeof LoginResponse>;

export function errorBody(code: string, message: string): ErrorResponse {
  return { error: { code, message } };
}

export const commonModel = new Elysia({ name: 'common.model' }).model({
  ErrorResponse,
  LoginBody,
  LoginResponse,
});
