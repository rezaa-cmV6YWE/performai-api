import { Scalar } from '@scalar/hono-api-reference';
import { Hono } from 'hono';

import { success } from '@/lib/response';
import openapiYaml from '@/openapi.yaml' with { type: 'text' };
import { v1 } from '@/routes/v1';

const app = new Hono();

app.get('/ok', (c) => c.json(success({ ok: true })));
app.route('/v1', v1);

app.get('/openapi.yaml', (c) => {
  return c.text(openapiYaml, 200, {
    'Content-Type': 'text/yaml; charset=utf-8',
  });
});
app.get('/openapi.json', (c) => c.redirect('/openapi.yaml'));
app.get('/doc', (c) => c.redirect('/openapi.yaml'));

const scalarDocs = Scalar({
  pageTitle: 'performai API Documentation',
  spec: {
    content: openapiYaml,
  },
});

app.get('/scalar', scalarDocs);
app.get('/docs', scalarDocs);
app.get('/reference', scalarDocs);

export default app;
