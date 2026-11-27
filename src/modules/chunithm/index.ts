import { Elysia } from 'elysia';

import {
  ChunithmCookieHeaders,
  chunithmModel,
  ChunithmServerParams,
} from '@/modules/chunithm/model';
import { ChunithmService } from '@/modules/chunithm/service';
import { commonModel } from '@/modules/common/model';

export const chunithmModule = new Elysia({
  name: 'chunithm',
  prefix: '/v1/:server/chunithm',
  tags: ['Chunithm'],
})
  .use(commonModel)
  .use(chunithmModel)
  .guard({
    params: ChunithmServerParams,
    response: {
      401: 'ErrorResponse',
      422: 'ErrorResponse',
      500: 'ErrorResponse',
    },
  })
  .post('/login', async ({ body }) => ({ data: { cookie: await ChunithmService.login(body) } }), {
    body: 'LoginBody',
    response: { 200: 'LoginResponse' },
    detail: {
      summary: 'Login to CHUNITHM Intl',
      description: 'Authenticates with SEGA ID and returns a cookie for accessing other endpoints.',
    },
  })
  .get(
    '/profile',
    async ({ params: { server }, headers }) => ({
      data: await ChunithmService.profile(server, headers['x-chunithm-cookie']),
    }),
    {
      headers: ChunithmCookieHeaders,
      response: { 200: 'ChunithmProfileResponse' },
      detail: {
        summary: 'Get Player Profile',
        description: 'Fetches the player profile including rating, overpower, and currency.',
      },
    }
  )
  .get(
    '/rating',
    async ({ params: { server }, headers }) => ({
      data: await ChunithmService.rating(server, headers['x-chunithm-cookie']),
    }),
    {
      headers: ChunithmCookieHeaders,
      response: { 200: 'ChunithmRatingResponse' },
      detail: {
        summary: 'Get Player Rating',
        description: 'Fetches the top 50 songs that make up the player rating.',
      },
    }
  );
