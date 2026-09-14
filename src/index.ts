import { Elysia } from 'elysia';

import { chunithmModule } from '@/modules/chunithm';
import { maimaiModule } from '@/modules/maimai';
import { errorHandler } from '@/plugins/error-handler';
import { openapiPlugin } from '@/plugins/openapi';

const port = Number(process.env.PORT) || 3000;

export const app = new Elysia()
  .use(errorHandler)
  .use(openapiPlugin)
  .use(maimaiModule)
  .use(chunithmModule)
  .listen(port);

console.log(`performai is running at http://${app.server?.hostname}:${app.server?.port}`);
