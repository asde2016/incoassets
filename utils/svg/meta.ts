import { customAlphabet } from 'nanoid';

export type IconMeta = {
  name: string;
  tags: string[];
  category: string;
  description: string;
};

export type MetaInput = {
  name?: string;
  tags?: string[];
  category?: string;
  description?: string;
};

export type MetaResult =
  | { ok: true; meta: IconMeta }
  | { ok: false; errors: string[] };

export function validateMeta(input: MetaInput): MetaResult {
  const errors: string[] = [];
  const name = (input.name ?? '').trim();
  if (name.length === 0) errors.push('name is required');
  if (name.length > 64) errors.push('name must be 64 chars or fewer');

  const tagsRaw = Array.isArray(input.tags) ? input.tags : [];
  const tagsLower = tagsRaw
    .map((t) => (typeof t === 'string' ? t.trim().toLowerCase() : ''))
    .filter((t) => t.length > 0 && t.length <= 30);
  const tags = Array.from(new Set(tagsLower));
  if (tags.length > 20) errors.push('too many tags (max 20)');

  const category = (input.category ?? '').trim();
  if (category.length > 30) errors.push('category must be 30 chars or fewer');

  const description = (input.description ?? '').trim();
  if (description.length > 500) errors.push('description must be 500 chars or fewer');

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, meta: { name, tags, category, description } };
}

const NANO = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6);

export function makeSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (slug.length === 0) return `icon-${NANO()}`;
  return slug;
}
