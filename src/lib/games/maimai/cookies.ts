import { parse, splitCookiesString } from 'set-cookie-parser';

type CookieInput = string | string[] | null;

function normalizeHeader(input: CookieInput): string {
  if (!input) return '';
  if (Array.isArray(input)) return input.join(', ');
  return input;
}

export function parseCookies(setCookieHeader: CookieInput): Map<string, string> {
  const raw = normalizeHeader(setCookieHeader);
  if (!raw) return new Map();
  const parsed = parse(splitCookiesString(raw));
  return new Map(parsed.map((c) => [c.name, c.value]));
}

export function cookieBag(setCookieHeader: CookieInput): string {
  const cookies = parseCookies(setCookieHeader);
  return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

export function mergeCookies(existing: CookieInput, setCookieHeader: CookieInput): string {
  const cookies = parseCookies(existing);
  for (const [k, v] of parseCookies(setCookieHeader)) {
    cookies.set(k, v);
  }
  return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

export function findCookie(setCookieHeader: CookieInput, name: string): string | null {
  return parseCookies(setCookieHeader).get(name) ?? null;
}
