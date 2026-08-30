import { parse, splitCookiesString } from 'set-cookie-parser';

export function parseCookies(setCookieHeader: string | null): Map<string, string> {
  if (!setCookieHeader) return new Map();
  const parsed = parse(splitCookiesString(setCookieHeader));
  return new Map(parsed.map((c) => [c.name, c.value]));
}

export function cookieBag(setCookieHeader: string | null): string {
  const cookies = parseCookies(setCookieHeader);
  return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

export function mergeCookies(existing: string | null, setCookieHeader: string | null): string {
  const cookies = parseCookies(existing);
  for (const [k, v] of parseCookies(setCookieHeader)) {
    cookies.set(k, v);
  }
  return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

export function findCookie(setCookieHeader: string | null, name: string): string | null {
  return parseCookies(setCookieHeader).get(name) ?? null;
}
