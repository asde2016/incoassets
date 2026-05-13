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

// slug 은 다운로드 파일명(${slug}.svg)으로 사용되므로 길이를 절제.
// 32 자 안에서 가능한 한 하이픈 경계로 끊어 단어 중간이 잘리지 않게 한다.
export const MAX_SLUG_LEN = 32;

export function makeSlug(name: string, maxLen: number = MAX_SLUG_LEN): string {
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (slug.length > maxLen) {
    const cut = slug.slice(0, maxLen);
    const lastHyphen = cut.lastIndexOf('-');
    slug = lastHyphen >= Math.floor(maxLen / 2)
      ? cut.slice(0, lastHyphen)
      : cut.replace(/-+$/g, '');
  }
  if (slug.length === 0) return `icon-${NANO()}`;
  return slug;
}
