import { buildPrompt } from '~/server/utils/buildPrompt';
import type { Bilingual, BilingualTags } from '~/composables/promptGuide';

function asBilingual(raw: unknown): Bilingual | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const ko = typeof o.ko === 'string' ? o.ko : '';
  const en = typeof o.en === 'string' ? o.en : '';
  if (!ko && !en) return undefined;
  return { ko, en };
}

function asBilingualTags(raw: unknown): BilingualTags | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const ko = Array.isArray(o.ko)
    ? (o.ko as unknown[]).filter((t): t is string => typeof t === 'string')
    : [];
  const en = Array.isArray(o.en)
    ? (o.en as unknown[]).filter((t): t is string => typeof t === 'string')
    : [];
  if (ko.length === 0 && en.length === 0) return undefined;
  return { ko, en };
}

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as {
    keyword?: unknown;
    description?: unknown;
    name?: unknown;
    category?: unknown;
    tags?: unknown;
  } | null;
  const keyword = typeof body?.keyword === 'string' ? body.keyword.trim() : '';
  const description =
    typeof body?.description === 'string' ? body.description : undefined;
  const name = asBilingual(body?.name);
  const category = asBilingual(body?.category);
  const tags = asBilingualTags(body?.tags);

  if (!keyword) {
    throw createError({ statusCode: 400, statusMessage: 'keyword required' });
  }

  try {
    return buildPrompt({ keyword, description, name, category, tags });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'buildPrompt failed';
    throw createError({ statusCode: 400, statusMessage: message });
  }
});
