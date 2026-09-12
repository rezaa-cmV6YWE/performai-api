type CookieInput = string | string[] | null;

/**
 * Extracts `name=value` from a single `Set-Cookie` header string by splitting
 * on `;` and taking the first segment.  This mirrors the approach used by
 * Tomomai and avoids `set-cookie-parser`'s `splitCookiesString` which can
 * corrupt cookie values containing commas (e.g. `Expires=Thu, 01 Jan 2026 …`).
 */
function extractPair(raw: string): [string, string] | null {
  const pair = raw.split(';')[0].trim();
  const eq = pair.indexOf('=');
  if (eq < 1) return null;
  return [pair.substring(0, eq), pair.substring(eq + 1)];
}

/**
 * Normalises the input into an array of individual Set-Cookie strings.
 *
 * - `string[]` from `headers.getSetCookie()` → returned as-is.
 * - `string` from `headers.get('set-cookie')` or an existing cookie-bag
 *   (`key=val; key2=val2`) → each `key=value` segment is an entry.
 * - `null` / empty → `[]`.
 */
function toEntries(input: CookieInput): [string, string][] {
  if (!input) return [];

  if (Array.isArray(input)) {
    const entries: [string, string][] = [];
    for (const h of input) {
      const pair = extractPair(h);
      if (pair) entries.push(pair);
    }
    return entries;
  }

  // Plain cookie-bag string: "key1=val1; key2=val2"
  const entries: [string, string][] = [];
  for (const segment of input.split(';')) {
    const trimmed = segment.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    entries.push([trimmed.substring(0, eq), trimmed.substring(eq + 1)]);
  }
  return entries;
}

export function parseCookies(setCookieHeader: CookieInput): Map<string, string> {
  return new Map(toEntries(setCookieHeader));
}

export function cookieBag(setCookieHeader: CookieInput): string {
  return toEntries(setCookieHeader)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

export function mergeCookies(existing: CookieInput, setCookieHeader: CookieInput): string {
  const cookies = parseCookies(existing);
  for (const [k, v] of toEntries(setCookieHeader)) {
    cookies.set(k, v);
  }
  return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

export function findCookie(setCookieHeader: CookieInput, name: string): string | null {
  return parseCookies(setCookieHeader).get(name) ?? null;
}
