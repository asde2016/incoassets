import { validateMeta, makeSlug } from '~/utils/svg/meta';
import { insertIcon } from '~/server/utils/repo/icons';

function pickStr(o: unknown, key: string): string {
  if (!o || typeof o !== 'object') return '';
  const v = (o as Record<string, unknown>)[key];
  return typeof v === 'string' ? v : '';
}

function pickArr(o: unknown, key: string): string[] {
  if (!o || typeof o !== 'object') return [];
  const v = (o as Record<string, unknown>)[key];
  return Array.isArray(v) ? v.filter((t): t is string => typeof t === 'string') : [];
}

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as {
    name?: unknown; // { ko, en }
    tags?: unknown; // { ko: [], en: [] }
    category?: unknown; // { ko, en }
    description?: unknown;
    svg?: unknown;
  } | null;

  if (typeof body?.svg !== 'string' || !body.svg.startsWith('<svg')) {
    throw createError({ statusCode: 400, statusMessage: 'svg required' });
  }

  const nameKo = pickStr(body.name, 'ko').trim();
  const nameEn = pickStr(body.name, 'en').trim();
  const categoryKo = pickStr(body.category, 'ko').trim();
  // category.en 은 현 schema 에 슬롯 없음 — 프롬프트 Concept 블록 용도로만 의미가 있어 저장 단계에서 drop.
  const tagsKo = pickArr(body.tags, 'ko');
  const tagsEn = pickArr(body.tags, 'en');
  const mergedTags = [...tagsKo, ...tagsEn];

  // 표시 이름은 한국어 우선, 없으면 영문으로 폴백.
  const displayName = nameKo || nameEn;

  const metaResult = validateMeta({
    name: displayName,
    tags: mergedTags,
    category: categoryKo,
    description: typeof body.description === 'string' ? body.description : '',
  });
  if (!metaResult.ok) {
    throw createError({
      statusCode: 422,
      statusMessage: metaResult.errors.join('; '),
    });
  }

  const { meta } = metaResult;
  // slug 은 영문 kebab 이름이 있으면 그대로 (idempotent), 없으면 한국어 표시명에서 유도 → 사실상 nano 폴백.
  const slug = nameEn ? makeSlug(nameEn) : makeSlug(meta.name);

  const inserted = insertIcon({
    name: meta.name,
    slug,
    tags: meta.tags,
    category: meta.category,
    description: meta.description,
    svg: body.svg,
  });

  return {
    id: inserted.id,
    name: inserted.name,
    slug: inserted.slug,
    category: inserted.category,
    description: inserted.description,
    tags: JSON.parse(inserted.tagsJson),
    svg: inserted.svg,
    createdAt: inserted.createdAt,
  };
});
