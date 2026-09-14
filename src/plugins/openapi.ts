import { openapi } from '@elysiajs/openapi';
import { Elysia } from 'elysia';

export const openapiPlugin = new Elysia({ name: 'openapi' })
  .use(
    openapi({
      path: '/docs',
      provider: 'scalar',
      documentation: {
        info: {
          title: 'performai API',
          version: '1.0.0',
          description: 'API for rhythm game data (maimai, chunithm, ongeki)',
        },
        tags: [
          { name: 'Maimai', description: 'Maimai DX Intl endpoints' },
          { name: 'Chunithm', description: 'CHUNITHM Intl endpoints' },
        ],
      },
    })
  )
  .get('/', ({ redirect }) => redirect('/docs'), {
    detail: {
      hide: true,
    },
  });
