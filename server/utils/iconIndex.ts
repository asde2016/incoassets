import fs from 'node:fs';
import path from 'node:path';

export type IconEntry = {
  set: string;
  name: string;
  body: string;
  w: number;
  h: number;
  tokens: string[];
};

let cache: IconEntry[] | null = null;

function loadIndex(): IconEntry[] {
  if (cache) return cache;
  const file = path.resolve(process.cwd(), 'server', 'data', 'icons-index.json');
  const raw = fs.readFileSync(file, 'utf8');
  cache = JSON.parse(raw) as IconEntry[];
  return cache;
}

export type SearchResult = {
  set: string;
  name: string;
  svg: string;
  score: number;
};

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .trim()
    .split(/[\s,;_-]+/)
    .filter(Boolean);
}

function wrapSvg(icon: IconEntry): string {
  // Wrap the body so the downstream customize transform (which sets width/height
  // and stroke-width on the root <svg>) has something to act on.
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${icon.w} ${icon.h}" ` +
    `fill="none" stroke="currentColor" stroke-width="2" ` +
    `stroke-linecap="round" stroke-linejoin="round">${icon.body}</svg>`
  );
}

function scoreEntry(entry: IconEntry, queryTokens: string[], queryRaw: string): number {
  if (queryTokens.length === 0) return 0;
  let score = 0;
  const nameLower = entry.name.toLowerCase();
  if (nameLower === queryRaw) score += 1000;
  if (nameLower.startsWith(queryRaw + '-') || nameLower === queryRaw) score += 500;
  if (nameLower.includes(queryRaw)) score += 200;
  for (const qt of queryTokens) {
    if (entry.tokens.includes(qt)) score += 50;
    else if (entry.tokens.some((t) => t.startsWith(qt))) score += 20;
    else if (nameLower.includes(qt)) score += 10;
  }
  return score;
}

export function searchIcons(query: string, limit = 48, set?: string): SearchResult[] {
  const entries = loadIndex();
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return [];
  const qRaw = query.toLowerCase().trim();

  const out: SearchResult[] = [];
  for (const entry of entries) {
    if (set && entry.set !== set) continue;
    const score = scoreEntry(entry, qTokens, qRaw);
    if (score <= 0) continue;
    out.push({ set: entry.set, name: entry.name, svg: wrapSvg(entry), score });
  }

  out.sort((a, b) => b.score - a.score || a.name.length - b.name.length);
  return out.slice(0, limit);
}