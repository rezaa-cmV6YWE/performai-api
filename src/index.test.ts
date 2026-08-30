import app from '@/index';

import { describe, expect, it } from 'bun:test';

describe('API routes and documentation', () => {
  describe('GET /ok', () => {
    it('returns 200 with ok status', async () => {
      const res = await app.request('/ok');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ data: { ok: true } });
    });
  });

  describe('OpenAPI specification endpoints', () => {
    it('GET /openapi.yaml returns valid OpenAPI 3.1.0 YAML spec', async () => {
      const res = await app.request('/openapi.yaml');
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/yaml');

      const text = await res.text();
      expect(text).toContain('openapi: 3.1.0');
      expect(text).toContain('title: performai API');
      expect(text).toContain('/ok:');
      expect(text).toContain('/v1/{server}/maimai/login:');
      expect(text).toContain('/v1/{server}/maimai/profile:');
      expect(text).toContain('/v1/{server}/maimai/rating:');
      expect(text).toContain('ErrorResponse:');
      expect(text).toContain('MaimaiProfile:');
      expect(text).toContain('MaimaiRating:');
    });

    it('GET /openapi.json redirects to /openapi.yaml', async () => {
      const res = await app.request('/openapi.json');
      expect(res.status).toBe(302);
      expect(res.headers.get('location')).toBe('/openapi.yaml');
    });

    it('GET /doc redirects to /openapi.yaml', async () => {
      const res = await app.request('/doc');
      expect(res.status).toBe(302);
      expect(res.headers.get('location')).toBe('/openapi.yaml');
    });
  });

  describe('Scalar API reference endpoints', () => {
    it('GET /scalar returns 200 HTML with Scalar UI reference', async () => {
      const res = await app.request('/scalar');
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/html');
      const html = await res.text();
      expect(html).toContain('performai API Documentation');
    });

    it('GET /docs returns 200 HTML with Scalar UI reference', async () => {
      const res = await app.request('/docs');
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/html');
      const html = await res.text();
      expect(html).toContain('performai API Documentation');
    });

    it('GET /reference returns 200 HTML with Scalar UI reference', async () => {
      const res = await app.request('/reference');
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/html');
      const html = await res.text();
      expect(html).toContain('performai API Documentation');
    });
  });

  describe('Route validation and not-implemented handlers', () => {
    it('POST /v1/intl/maimai/login fails on missing credentials', async () => {
      const res = await app.request('/v1/intl/maimai/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: { code: string; message: string } };
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('POST /v1/jp/maimai/login returns 501 NOT_IMPLEMENTED', async () => {
      const res = await app.request('/v1/jp/maimai/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segaId: 'user', password: 'pwd' }),
      });
      expect(res.status).toBe(501);
      const body = (await res.json()) as { error: { code: string; message: string } };
      expect(body.error.code).toBe('NOT_IMPLEMENTED');
    });

    it('GET /v1/intl/maimai/profile fails on missing x-maimai-cookie header', async () => {
      const res = await app.request('/v1/intl/maimai/profile');
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: { code: string; message: string } };
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('GET /v1/jp/maimai/profile returns 501 NOT_IMPLEMENTED', async () => {
      const res = await app.request('/v1/jp/maimai/profile', {
        headers: { 'x-maimai-cookie': 'dummy-cookie' },
      });
      expect(res.status).toBe(501);
      const body = (await res.json()) as { error: { code: string; message: string } };
      expect(body.error.code).toBe('NOT_IMPLEMENTED');
    });

    it('GET /v1/intl/maimai/rating fails on missing x-maimai-cookie header', async () => {
      const res = await app.request('/v1/intl/maimai/rating');
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: { code: string; message: string } };
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('GET /v1/jp/maimai/rating returns 501 NOT_IMPLEMENTED', async () => {
      const res = await app.request('/v1/jp/maimai/rating', {
        headers: { 'x-maimai-cookie': 'dummy-cookie' },
      });
      expect(res.status).toBe(501);
      const body = (await res.json()) as { error: { code: string; message: string } };
      expect(body.error.code).toBe('NOT_IMPLEMENTED');
    });
  });
});
