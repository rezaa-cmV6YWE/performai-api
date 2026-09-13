import { Elysia } from 'elysia';
import { z } from 'zod';

import { MaimaiProfileExtended, MaimaiRating } from '@/lib/games/maimai/schemas';
import { cookieHeaders, loginBody, serverParams } from '@/modules/maimai/model';
import { MaimaiService } from '@/modules/maimai/service';

const ErrorResponse = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export const maimaiModule = new Elysia({
  prefix: '/v1/:server/maimai',
  name: 'maimai',
})
  .post(
    '/login',
    ({ params, body }) => MaimaiService.login(params.server, body.segaId, body.password),
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
        tags: ['Maimai'],
        summary: 'Login to Maimai DX Intl',
        description:
          'Authenticates with SEGA ID and returns a cookie for accessing other endpoints.',
      },
    }
  )
  .get(
    '/profile',
    ({ params, headers }) => MaimaiService.profile(params.server, headers['x-maimai-cookie']),
    {
      params: serverParams,
      headers: cookieHeaders,
      response: {
        200: z.object({
          data: MaimaiProfileExtended,
        }),
        422: ErrorResponse,
        500: ErrorResponse,
        501: ErrorResponse,
      },
      detail: {
        tags: ['Maimai'],
        summary: 'Get Player Profile',
        description: 'Fetches the player profile including rating, title, and stars.',
      },
    }
  )
  .get(
    '/rating',
    ({ params, headers }) => MaimaiService.rating(params.server, headers['x-maimai-cookie']),
    {
      params: serverParams,
      headers: cookieHeaders,
      response: {
        200: z.object({
          data: MaimaiRating,
        }),
        422: ErrorResponse,
        500: ErrorResponse,
        501: ErrorResponse,
      },
      detail: {
        tags: ['Maimai'],
        summary: 'Get Player Rating',
        description: 'Fetches the top 50 songs that make up the player rating.',
      },
    }
  );
