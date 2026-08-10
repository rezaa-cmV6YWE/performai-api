import { GameError } from '@/lib/errors';
import { getMaimaiProfile } from '@/lib/games/maimai';
import { error, success } from '@/lib/response';
import { validator } from '@/lib/validator';
import { Hono } from 'hono';
import { z } from 'zod';

const paramsSchema = z.object({
  server: z.enum(['intl', 'jp', 'cn']),
  game: z.enum(['maimai', 'chunithm', 'ongeki']),
});

const headerSchema = z.object({
  'x-game-cookie': z.string().min(1),
});

const app = new Hono();

app.get('/', validator('param', paramsSchema), validator('header', headerSchema), async (c) => {
  const { server, game } = c.req.valid('param');
  const { 'x-game-cookie': cookie } = c.req.valid('header');

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
    const profile = await getMaimaiProfile(server, cookie);
    return c.json(success(profile));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('profile error:', message);

    if (err instanceof GameError) {
      c.status(err.statusCode as Parameters<typeof c.status>[0]);
      return c.json(error(err.code, err.message));
    }
    return c.json(error('INTERNAL_ERROR', message), 500);
  }
});

export default app;
