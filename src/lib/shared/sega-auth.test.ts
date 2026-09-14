import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';

import { AuthError, GameError } from '@/lib/errors';
import { loginChunithmIntl } from '@/lib/games/chunithm/auth';
import { loginMaimaiIntl } from '@/lib/games/maimai/auth';
import type { SegaAuthConfig } from '@/lib/shared/sega-auth';
import { loginSega, refreshSegaSession } from '@/lib/shared/sega-auth';

const TEST_CONFIG: SegaAuthConfig = {
  siteId: 'test_site',
  redirectUrl: 'https://test-game.com/mobile/',
  backUrl: 'https://test-game.com/',
  allowedCookies: ['clal', '_t', 'userId', 'AWSALBTG'],
};

describe('sega-auth', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    // Reset mocks before each test
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('loginSega', () => {
    it('successfully logs in and returns filtered cookies', async () => {
      let callIndex = 0;
      globalThis.fetch = mock(async (input: RequestInfo | URL, init?: RequestInit) => {
        callIndex++;
        const url = typeof input === 'string' ? input : input.toString();

        if (callIndex === 1) {
          // Step 1: GET login page
          expect(url).toContain('site_id=test_site');
          return new Response('', {
            status: 200,
            headers: {
              'Set-Cookie': 'pre_sess=pre123; Path=/',
            },
          });
        }

        if (callIndex === 2) {
          // Step 2: POST credentials
          expect(url).toContain('/login/sid');
          expect(init?.method).toBe('POST');
          return new Response('', {
            status: 302,
            headers: {
              Location: 'https://test-game.com/mobile/home',
              'Set-Cookie': 'clal=secret_clal_123; Path=/',
            },
          });
        }

        if (callIndex === 3) {
          // Step 3: Follow redirect to game mobile home
          expect(url).toBe('https://test-game.com/mobile/home');
          return new Response('<html>Home</html>', {
            status: 200,
            headers: [
              ['Set-Cookie', '_t=token456; Path=/'],
              ['Set-Cookie', 'userId=user789; Path=/'],
              ['Set-Cookie', 'ignored_cookie=ignore; Path=/'],
              ['Set-Cookie', 'AWSALBTG=albtg_val; Path=/'],
            ],
          });
        }

        throw new Error(`Unexpected fetch call ${callIndex} to ${url}`);
      }) as unknown as typeof fetch;

      const cookie = await loginSega(TEST_CONFIG, 'my_sega_id', 'my_password');
      expect(cookie).toContain('clal=secret_clal_123');
      expect(cookie).toContain('_t=token456');
      expect(cookie).toContain('userId=user789');
      expect(cookie).toContain('AWSALBTG=albtg_val');
      expect(cookie).not.toContain('ignored_cookie');
    });

    it('throws AuthError when login POST does not return 302', async () => {
      globalThis.fetch = mock(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/login?')) {
          return new Response('', { status: 200 });
        }
        return new Response('Blocked', { status: 403 });
      }) as unknown as typeof fetch;

      expect(loginSega(TEST_CONFIG, 'user', 'pass')).rejects.toThrow(AuthError);
    });

    it('throws AuthError when redirected back to login or with alof failure', async () => {
      globalThis.fetch = mock(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/login?')) {
          return new Response('', { status: 200 });
        }
        return new Response('', {
          status: 302,
          headers: { Location: 'https://lng-tgk-aime-gw.am-all.net/common_auth/login?alof=1' },
        });
      }) as unknown as typeof fetch;

      expect(loginSega(TEST_CONFIG, 'user', 'pass')).rejects.toThrow(AuthError);
    });

    it('throws GameError when redirected to unexpected origin', async () => {
      globalThis.fetch = mock(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/login?')) {
          return new Response('', { status: 200 });
        }
        return new Response('', {
          status: 302,
          headers: { Location: 'https://evil-site.com/hack' },
        });
      }) as unknown as typeof fetch;

      expect(loginSega(TEST_CONFIG, 'user', 'pass')).rejects.toThrow(GameError);
    });

    it('throws GameError when clal cookie is missing from login response', async () => {
      globalThis.fetch = mock(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/login?')) {
          return new Response('', { status: 200 });
        }
        return new Response('', {
          status: 302,
          headers: {
            Location: 'https://test-game.com/mobile/callback',
            // No clal in Set-Cookie
            'Set-Cookie': 'other=123; Path=/',
          },
        });
      }) as unknown as typeof fetch;

      expect(loginSega(TEST_CONFIG, 'user', 'pass')).rejects.toThrow(GameError);
    });
  });

  describe('refreshSegaSession', () => {
    it('successfully refreshes session from clal cookie', async () => {
      let callIndex = 0;
      globalThis.fetch = mock(async (input: RequestInfo | URL) => {
        callIndex++;
        const url = typeof input === 'string' ? input : input.toString();

        if (callIndex === 1) {
          return new Response('', {
            status: 302,
            headers: {
              Location: 'https://test-game.com/mobile/home',
            },
          });
        }

        if (callIndex === 2) {
          return new Response('<html>Home</html>', {
            status: 200,
            headers: [
              ['Set-Cookie', '_t=new_token; Path=/'],
              ['Set-Cookie', 'userId=new_user; Path=/'],
            ],
          });
        }

        throw new Error(`Unexpected fetch call ${callIndex} to ${url}`);
      }) as unknown as typeof fetch;

      const cookie = await refreshSegaSession(TEST_CONFIG, 'clal=my_clal_token');
      expect(cookie).toContain('_t=new_token');
      expect(cookie).toContain('userId=new_user');
      expect(cookie).not.toContain('clal');
    });

    it('throws AuthError when clal is missing from input', async () => {
      expect(refreshSegaSession(TEST_CONFIG, 'other=cookie')).rejects.toThrow(AuthError);
    });

    it('throws AuthError when refresh response is not 302', async () => {
      globalThis.fetch = mock(async () => {
        return new Response('Unauthorized', { status: 401 });
      }) as unknown as typeof fetch;

      expect(refreshSegaSession(TEST_CONFIG, 'clal=expired_token')).rejects.toThrow(AuthError);
    });
  });

  describe('game wrappers', () => {
    it('loginChunithmIntl sends site_id=chuniex', async () => {
      let requestedUrl = '';
      globalThis.fetch = mock(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/login?')) {
          requestedUrl = url;
          return new Response('', { status: 200 });
        }
        return new Response('', {
          status: 302,
          headers: {
            Location: 'https://chunithm-net-eng.com/mobile/home',
            'Set-Cookie': 'clal=token; Path=/',
          },
        });
      }) as unknown as typeof fetch;

      try {
        await loginChunithmIntl('sid', 'pass');
      } catch {
        // May fail on redirect step 3, which is fine, we want to verify step 1 url
      }

      expect(requestedUrl).toContain('site_id=chuniex');
      expect(requestedUrl).toContain('chunithm-net-eng.com');
    });

    it('loginMaimaiIntl sends site_id=maimaidxex', async () => {
      let requestedUrl = '';
      globalThis.fetch = mock(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/login?')) {
          requestedUrl = url;
          return new Response('', { status: 200 });
        }
        return new Response('', {
          status: 302,
          headers: {
            Location: 'https://maimaidx-eng.com/maimai-mobile/home',
            'Set-Cookie': 'clal=token; Path=/',
          },
        });
      }) as unknown as typeof fetch;

      try {
        await loginMaimaiIntl('sid', 'pass');
      } catch {
        // May fail on redirect step 3, which is fine
      }

      expect(requestedUrl).toContain('site_id=maimaidxex');
      expect(requestedUrl).toContain('maimaidx-eng.com');
    });
  });
});
