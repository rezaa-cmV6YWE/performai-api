import { describe, expect, it } from 'bun:test';

import { app } from '@/index';

describe('API routes and documentation', () => {
  describe('GET /ok', () => {
    it('returns 200 with ok status', async () => {
      const res = await app.handle(new Request('http://localhost/ok'));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ data: { ok: true } });
    });
  });

  describe('OpenAPI specification endpoints', () => {
    it('GET /docs/json returns valid OpenAPI JSON spec', async () => {
      const res = await app.handle(new Request('http://localhost/docs/json'));
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('application/json');

      const text = await res.text();
      expect(text).toContain('openapi');
      expect(text).toContain('performai API');
      expect(text).toContain('/ok');
      expect(text).toContain('/v1/{server}/maimai/login');
      expect(text).toContain('/v1/{server}/maimai/profile');
      expect(text).toContain('/v1/{server}/maimai/rating');
    });
  });

  describe('Scalar API reference endpoints', () => {
    it('GET /docs returns 200 HTML with Scalar UI reference', async () => {
      const res = await app.handle(new Request('http://localhost/docs'));
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/html');
    });
  });

  describe('Route validation and not-implemented handlers', () => {
    it('POST /v1/intl/maimai/login fails on missing credentials', async () => {
      const res = await app.handle(
        new Request('http://localhost/v1/intl/maimai/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
      );
      expect(res.status).toBe(422);
      const body = (await res.json()) as { error: { code: string; message: string } };
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('POST /v1/jp/maimai/login returns 501 NOT_IMPLEMENTED', async () => {
      const res = await app.handle(
        new Request('http://localhost/v1/jp/maimai/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ segaId: 'user', password: 'pwd' }),
        })
      );
      expect(res.status).toBe(501);
      const body = (await res.json()) as { error: { code: string; message: string } };
      expect(body.error.code).toBe('NOT_IMPLEMENTED');
    });

    it('GET /v1/intl/maimai/profile fails on missing x-maimai-cookie header', async () => {
      const res = await app.handle(new Request('http://localhost/v1/intl/maimai/profile'));
      expect(res.status).toBe(422);
      const body = (await res.json()) as { error: { code: string; message: string } };
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('GET /v1/jp/maimai/profile returns 501 NOT_IMPLEMENTED', async () => {
      const res = await app.handle(
        new Request('http://localhost/v1/jp/maimai/profile', {
          headers: { 'x-maimai-cookie': 'dummy-cookie' },
        })
      );
      expect(res.status).toBe(501);
      const body = (await res.json()) as { error: { code: string; message: string } };
      expect(body.error.code).toBe('NOT_IMPLEMENTED');
    });

    it('GET /v1/intl/maimai/rating fails on missing x-maimai-cookie header', async () => {
      const res = await app.handle(new Request('http://localhost/v1/intl/maimai/rating'));
      expect(res.status).toBe(422);
      const body = (await res.json()) as { error: { code: string; message: string } };
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('GET /v1/jp/maimai/rating returns 501 NOT_IMPLEMENTED', async () => {
      const res = await app.handle(
        new Request('http://localhost/v1/jp/maimai/rating', {
          headers: { 'x-maimai-cookie': 'dummy-cookie' },
        })
      );
      expect(res.status).toBe(501);
      const body = (await res.json()) as { error: { code: string; message: string } };
      expect(body.error.code).toBe('NOT_IMPLEMENTED');
    });
  });
});
