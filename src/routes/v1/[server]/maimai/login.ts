import { Hono } from 'hono';

import { GameError } from '@/lib/errors';
import { loginMaimaiIntl } from '@/lib/games/maimai';
import { loginBodySchema, serverSchema } from '@/lib/games/maimai/schemas';
import { error, success } from '@/lib/response';
import { validator } from '@/lib/validator';

const app = new Hono();

app.post('/', validator('param', serverSchema), validator('json', loginBodySchema), async (c) => {
  const { server } = c.req.valid('param');
  const { segaId, password } = c.req.valid('json');

  if (server !== 'intl') {
    return c.json(error('NOT_IMPLEMENTED', `server '${server}' not yet supported for maimai`), 501);
  }

  try {
    const cookie = await loginMaimaiIntl(segaId, password);
    return c.json(success({ cookie }));
  } catch (err) {
    if (err instanceof GameError) {
      c.status(err.statusCode as Parameters<typeof c.status>[0]);
      return c.json(error(err.code, err.message));
    }
    const message = err instanceof Error ? err.message : 'internal error';
    return c.json(error('INTERNAL_ERROR', message), 500);
  }
});

export default app;
