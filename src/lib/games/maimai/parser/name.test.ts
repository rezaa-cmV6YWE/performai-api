import { basenameFromUrl, normalizeName } from '@/lib/games/maimai/parser/name';

import { describe, expect, it } from 'bun:test';

describe('normalizeName', () => {
  it('normalizes full-width characters to ASCII, lowercases, and trims whitespace', () => {
    expect(normalizeName('  Ｔｅｓｔ  Ｓｏｎｇ  ')).toBe('test song');
    expect(normalizeName('Garakuta Doll Play')).toBe('garakuta doll play');
  });

  it('collapses multiple spaces into one', () => {
    expect(normalizeName('a   b   c')).toBe('a b c');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(normalizeName('   ')).toBe('');
  });

  it('returns empty string for empty input', () => {
    expect(normalizeName('')).toBe('');
  });

  it('lowercases mixed-case ASCII names', () => {
    expect(normalizeName('HELLO World')).toBe('hello world');
  });

  it('handles Japanese full-width digits and letters uniformly', () => {
    // Full-width digits should normalize to ASCII digits
    expect(normalizeName('１２３')).toBe('123');
  });

  it('preserves numbers and special ASCII punctuation', () => {
    expect(normalizeName('Song #1 (remix)')).toBe('song #1 (remix)');
  });
});

describe('basenameFromUrl', () => {
  it('extracts the basename from an HTTPS URL', () => {
    expect(basenameFromUrl('https://maimaidx-eng.com/maimai-mobile/img/Music/abc.png')).toBe(
      'abc.png'
    );
  });

  it('extracts from a relative URL', () => {
    expect(basenameFromUrl('/img/Music/some_jacket.png')).toBe('some_jacket.png');
  });

  it('handles a URL with no path segments beyond root', () => {
    expect(basenameFromUrl('https://example.com/')).toBeUndefined();
  });

  it('returns undefined for undefined input', () => {
    expect(basenameFromUrl(undefined)).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(basenameFromUrl('')).toBeUndefined();
  });

  it('returns the filename when URL has no slashes (plain filename)', () => {
    expect(basenameFromUrl('file.png')).toBe('file.png');
  });
});
