import { describe, expect, it } from 'bun:test';

import { cookieBag, findCookie, mergeCookies, parseCookies } from '@/lib/games/maimai/cookies';

describe('parseCookies', () => {
  it('parses a multi-cookie Set-Cookie header array (getSetCookie format)', () => {
    const headers = ['sid=12345; Path=/; HttpOnly', 'clal=abcdef; Path=/; Secure'];
    const parsed = parseCookies(headers);
    expect(parsed.get('sid')).toBe('12345');
    expect(parsed.get('clal')).toBe('abcdef');
  });

  it('parses a cookie-bag string', () => {
    const parsed = parseCookies('sid=12345; clal=abcdef');
    expect(parsed.get('sid')).toBe('12345');
    expect(parsed.get('clal')).toBe('abcdef');
  });

  it('parses a single cookie from an array', () => {
    const parsed = parseCookies(['token=abc; Path=/']);
    expect(parsed.size).toBe(1);
    expect(parsed.get('token')).toBe('abc');
  });

  it('handles cookie values that contain = signs', () => {
    const parsed = parseCookies(['data=base64==; Path=/']);
    expect(parsed.get('data')).toBe('base64==');
  });

  it('handles cookie values with commas in Expires (no corruption)', () => {
    const headers = [
      'sid=12345; Expires=Thu, 01 Jan 2026 00:00:00 GMT; Path=/',
      'clal=abcdef; Expires=Fri, 02 Feb 2026 00:00:00 GMT; Path=/',
    ];
    const parsed = parseCookies(headers);
    expect(parsed.get('sid')).toBe('12345');
    expect(parsed.get('clal')).toBe('abcdef');
  });

  it('returns empty map for null', () => {
    expect(parseCookies(null).size).toBe(0);
  });

  it('returns empty map for empty string', () => {
    expect(parseCookies('').size).toBe(0);
  });

  it('returns empty map for empty array', () => {
    expect(parseCookies([]).size).toBe(0);
  });
});

describe('cookieBag', () => {
  it('formats cookies from an array of Set-Cookie strings', () => {
    const bag = cookieBag(['a=1; Path=/', 'b=2; Path=/']);
    expect(bag).toBe('a=1; b=2');
  });

  it('formats cookies from a cookie-bag string', () => {
    const bag = cookieBag('a=1; b=2');
    expect(bag).toBe('a=1; b=2');
  });

  it('returns empty string for null', () => {
    expect(cookieBag(null)).toBe('');
  });

  it('returns a single cookie pair for a single cookie header', () => {
    expect(cookieBag(['foo=bar; Path=/'])).toBe('foo=bar');
  });
});

describe('mergeCookies', () => {
  it('merges new cookies on top of existing ones, overwriting duplicates', () => {
    const merged = mergeCookies('a=1; b=2', ['b=updated; Path=/', 'c=3; Path=/']);
    expect(merged).toBe('a=1; b=updated; c=3');
  });

  it('handles null existing cookies', () => {
    expect(mergeCookies(null, ['x=1; Path=/'])).toBe('x=1');
  });

  it('handles null new header', () => {
    expect(mergeCookies('a=1', null)).toBe('a=1');
  });

  it('returns empty string when both args are null', () => {
    expect(mergeCookies(null, null)).toBe('');
  });

  it('adds brand new cookies without disturbing the existing ones', () => {
    const merged = mergeCookies('sess=abc', ['lang=en; Path=/']);
    expect(merged).toBe('sess=abc; lang=en');
  });

  it('merges correctly when both args are string arrays', () => {
    const merged = mergeCookies(['a=1; Path=/'], ['b=2; Path=/']);
    expect(merged).toBe('a=1; b=2');
  });
});

describe('findCookie', () => {
  it('finds a specific cookie by name from array', () => {
    expect(findCookie(['foo=bar; Path=/', 'clal=secret_token; Path=/'], 'clal')).toBe(
      'secret_token'
    );
  });

  it('finds a specific cookie by name from string', () => {
    expect(findCookie('foo=bar; clal=secret_token', 'clal')).toBe('secret_token');
  });

  it('returns null when cookie name is not present', () => {
    expect(findCookie(['foo=bar; Path=/'], 'nonexistent')).toBeNull();
  });

  it('returns null for null header', () => {
    expect(findCookie(null, 'foo')).toBeNull();
  });
});
