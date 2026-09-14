import { Elysia } from 'elysia';
import { z } from 'zod';

import { loginBody, serverParams } from '@/modules/chunithm/model';
import { ChunithmService } from '@/modules/chunithm/service';

const ErrorResponse = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export const chunithmModule = new Elysia({
  prefix: '/v1/:server/chunithm',
  name: 'chunithm',
}).post(
  '/login',
  ({ params, body }) => ChunithmService.login(params.server, body.segaId, body.password),
  {
    params: serverParams,
    body: loginBody,
    response: {
      200: z.object({
        data: z.object({ cookie: z.string() }),
      }),
      422: ErrorResponse,
      500: ErrorResponse,
      501: ErrorResponse,
    },
    detail: {
      tags: ['Chunithm'],
      summary: 'Login to CHUNITHM Intl',
      description: 'Authenticates with SEGA ID and returns a cookie for accessing other endpoints.',
    },
  }
);
