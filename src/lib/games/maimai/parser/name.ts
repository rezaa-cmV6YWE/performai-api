export function normalizeName(name: string): string {
  return name.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function basenameFromUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const parts = url.split('/');
  return parts[parts.length - 1] || undefined;
}
