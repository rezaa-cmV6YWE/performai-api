import { Elysia } from 'elysia';
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker';

import { maimaiModule } from '@/modules/maimai';
import { errorHandler } from '@/plugins/error-handler';
import { openapiPlugin } from '@/plugins/openapi';

export const app = new Elysia({ adapter: CloudflareAdapter })
  .use(errorHandler)
  .use(openapiPlugin)
  .get('/ok', () => ({ data: { ok: true } }))
  .use(maimaiModule)
  .compile();

export default app;
