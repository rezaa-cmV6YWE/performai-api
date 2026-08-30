import { cookieBag, findCookie, mergeCookies, parseCookies } from '@/lib/games/maimai/cookies';

import { describe, expect, it } from 'bun:test';

describe('parseCookies', () => {
  it('parses a multi-cookie Set-Cookie header', () => {
    const header = 'sid=12345; Path=/; HttpOnly, clal=abcdef; Path=/; Secure';
    const parsed = parseCookies(header);
    expect(parsed.get('sid')).toBe('12345');
    expect(parsed.get('clal')).toBe('abcdef');
  });

  it('parses a single cookie', () => {
    const parsed = parseCookies('token=abc; Path=/');
    expect(parsed.size).toBe(1);
    expect(parsed.get('token')).toBe('abc');
  });

  it('handles cookie values that contain = signs', () => {
    const parsed = parseCookies('data=base64==; Path=/');
    expect(parsed.get('data')).toBe('base64==');
  });

  it('returns empty map for null', () => {
    expect(parseCookies(null).size).toBe(0);
  });

  it('returns empty map for empty string', () => {
    expect(parseCookies('').size).toBe(0);
  });
});

describe('cookieBag', () => {
  it('formats multiple cookies as a semicolon-separated bag string', () => {
    const bag = cookieBag('a=1; Path=/, b=2; Path=/');
    expect(bag).toBe('a=1; b=2');
  });

  it('returns empty string for null', () => {
    expect(cookieBag(null)).toBe('');
  });

  it('returns a single cookie pair for a single cookie header', () => {
    expect(cookieBag('foo=bar; Path=/')).toBe('foo=bar');
  });
});

describe('mergeCookies', () => {
  it('merges new cookies on top of existing ones, overwriting duplicates', () => {
    const merged = mergeCookies('a=1; b=2', 'b=updated; Path=/, c=3; Path=/');
    expect(merged).toBe('a=1; b=updated; c=3');
  });

  it('handles null existing cookies', () => {
    expect(mergeCookies(null, 'x=1; Path=/')).toBe('x=1');
  });

  it('handles null new header', () => {
    expect(mergeCookies('a=1', null)).toBe('a=1');
  });

  it('returns empty string when both args are null', () => {
    expect(mergeCookies(null, null)).toBe('');
  });

  it('adds brand new cookies without disturbing the existing ones', () => {
    const merged = mergeCookies('sess=abc', 'lang=en; Path=/');
    expect(merged).toBe('sess=abc; lang=en');
  });
});

describe('findCookie', () => {
  it('finds a specific cookie by name', () => {
    expect(findCookie('foo=bar; Path=/, clal=secret_token; Path=/', 'clal')).toBe('secret_token');
  });

  it('returns null when cookie name is not present', () => {
    expect(findCookie('foo=bar; Path=/', 'nonexistent')).toBeNull();
  });

  it('returns null for null header', () => {
    expect(findCookie(null, 'foo')).toBeNull();
  });
});
