import { Elysia } from 'elysia';

import { chunithmModule } from '@/modules/chunithm';
import { maimaiModule } from '@/modules/maimai';
import { errorHandler } from '@/plugins/error-handler';
import { openapiPlugin } from '@/plugins/openapi';

export const app = new Elysia()
  .use(errorHandler)
  .use(openapiPlugin)
  .use(maimaiModule)
  .use(chunithmModule);
