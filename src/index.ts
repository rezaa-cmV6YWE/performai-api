import { Elysia } from 'elysia';

import { maimaiModule } from '@/modules/maimai';
import { errorHandler } from '@/plugins/error-handler';
import { openapiPlugin } from '@/plugins/openapi';

const port = Number(process.env.PORT) || 3000;

export const app = new Elysia()
  .use(errorHandler)
  .use(openapiPlugin)
  .get('/', ({ redirect }) => redirect('/docs'), {
    detail: {
      hide: true,
    },
  })
  .use(maimaiModule)
  .listen(port);

console.log(`performai is running at http://${app.server?.hostname}:${app.server?.port}`);
