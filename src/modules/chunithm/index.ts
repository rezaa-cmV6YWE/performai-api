import { Elysia } from 'elysia';
import { z } from 'zod';

import { ChunithmProfileExtended, ChunithmRating } from '@/lib/games/chunithm/schemas';
import { cookieHeaders, loginBody, serverParams } from '@/modules/chunithm/model';
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
})
  .post(
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
        description:
          'Authenticates with SEGA ID and returns a cookie for accessing other endpoints.',
      },
    }
  )
  .get(
    '/profile',
    ({ params, headers }) => ChunithmService.profile(params.server, headers['x-chunithm-cookie']),
    {
      params: serverParams,
      headers: cookieHeaders,
      response: {
        200: z.object({
          data: ChunithmProfileExtended,
        }),
        422: ErrorResponse,
        500: ErrorResponse,
        501: ErrorResponse,
      },
      detail: {
        tags: ['Chunithm'],
        summary: 'Get Player Profile',
        description: 'Fetches the player profile including rating, overpower, and currency.',
      },
    }
  )
  .get(
    '/rating',
    ({ params, headers }) => ChunithmService.rating(params.server, headers['x-chunithm-cookie']),
    {
      params: serverParams,
      headers: cookieHeaders,
      response: {
        200: z.object({
          data: ChunithmRating,
        }),
        422: ErrorResponse,
        500: ErrorResponse,
        501: ErrorResponse,
      },
      detail: {
        tags: ['Chunithm'],
        summary: 'Get Player Rating',
        description: 'Fetches the top 50 songs that make up the player rating.',
      },
    }
  );
