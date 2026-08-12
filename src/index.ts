import { Hono } from 'hono';

import { success } from '@/lib/response';
import { v1 } from '@/routes/v1';

const app = new Hono();

app.get('/ok', (c) => c.json(success({ ok: true })));
app.route('/v1', v1);

export default app;
