import { Hono } from 'hono';

import { GameError } from '@/lib/errors';
import { getMaimaiRating } from '@/lib/games/maimai';
import { profileHeaderSchema, serverSchema } from '@/lib/games/maimai/schemas';
import { error, success } from '@/lib/response';
import { validator } from '@/lib/validator';

const app = new Hono();

app.get(
  '/',
  validator('param', serverSchema),
  validator('header', profileHeaderSchema),
  async (c) => {
    const { server } = c.req.valid('param');
    const { 'x-maimai-cookie': cookie } = c.req.valid('header');

    if (server !== 'intl') {
      return c.json(
        error('NOT_IMPLEMENTED', `server '${server}' not yet supported for maimai`),
        501
      );
    }

    try {
      const rating = await getMaimaiRating(server, cookie);
      return c.json(success(rating));
    } catch (err) {
      if (err instanceof GameError) {
        c.status(err.statusCode as Parameters<typeof c.status>[0]);
        return c.json(error(err.code, err.message));
      }
      const message = err instanceof Error ? err.message : 'internal error';
      return c.json(error('INTERNAL_ERROR', message), 500);
    }
  }
);

export default app;
