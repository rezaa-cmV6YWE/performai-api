import { Elysia } from 'elysia';

import { commonModel, errorBody } from '@/modules/common/model';
import { MaimaiCookieHeaders, maimaiModel, MaimaiServerParams } from '@/modules/maimai/model';
import { MaimaiService } from '@/modules/maimai/service';

export const maimaiModule = new Elysia({
  name: 'maimai',
  prefix: '/v1/:server/maimai',
  tags: ['Maimai'],
})
  .use(commonModel)
  .use(maimaiModel)
  .guard({
    params: MaimaiServerParams,
    response: {
      401: 'ErrorResponse',
      422: 'ErrorResponse',
      500: 'ErrorResponse',
      501: 'ErrorResponse',
    },
    beforeHandle({ params: { server }, status }) {
      if (server !== 'intl') {
        return status(
          501,
          errorBody('NOT_IMPLEMENTED', `server '${server}' not yet supported for maimai`)
        );
      }
    },
  })
  .post('/login', async ({ body }) => ({ data: { cookie: await MaimaiService.login(body) } }), {
    body: 'LoginBody',
    response: { 200: 'LoginResponse' },
    detail: {
      summary: 'Login to Maimai DX Intl',
      description: 'Authenticates with SEGA ID and returns a cookie for accessing other endpoints.',
    },
  })
  .get(
    '/profile',
    async ({ params: { server }, headers }) => ({
      data: await MaimaiService.profile(server, headers['x-maimai-cookie']),
    }),
    {
      headers: MaimaiCookieHeaders,
      response: { 200: 'MaimaiProfileResponse' },
      detail: {
        summary: 'Get Player Profile',
        description: 'Fetches the player profile including rating, title, and stars.',
      },
    }
  )
  .get(
    '/rating',
    async ({ headers }) => ({ data: await MaimaiService.rating(headers['x-maimai-cookie']) }),
    {
      headers: MaimaiCookieHeaders,
      response: { 200: 'MaimaiRatingResponse' },
      detail: {
        summary: 'Get Player Rating',
        description: 'Fetches the top 50 songs that make up the player rating.',
      },
    }
  );
