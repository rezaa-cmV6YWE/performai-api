import { GameError } from '@/lib/errors';
import { loginMaimaiIntl } from '@/lib/games/maimai/auth';
import { error, success } from '@/lib/response';
import { validator } from '@/lib/validator';
import { Hono } from 'hono';
import { z } from 'zod';

const paramsSchema = z.object({
  server: z.enum(['intl', 'jp', 'cn']),
  game: z.enum(['maimai', 'chunithm', 'ongeki']),
});

const bodySchema = z.object({
  segaId: z.string().min(1),
  password: z.string().min(1),
});

const app = new Hono();

app.post('/', validator('param', paramsSchema), validator('json', bodySchema), async (c) => {
  const { server, game } = c.req.valid('param');
  const { segaId, password } = c.req.valid('json');

  if (game !== 'maimai') {
    return c.json(error('NOT_IMPLEMENTED', `game '${game}' not yet supported`), 501);
  }

  if (server !== 'intl') {
    return c.json(
      error('NOT_IMPLEMENTED', `server '${server}' not yet supported for ${game}`),
      501
    );
  }

  try {
    const cookie = await loginMaimaiIntl(segaId, password);
    return c.json(success({ cookie }));
  } catch (err) {
    if (err instanceof GameError) {
      c.status(err.statusCode as Parameters<typeof c.status>[0]);
      return c.json(error(err.code, err.message));
    }
    return c.json(error('INTERNAL_ERROR', 'internal error'), 500);
  }
});

export default app;
