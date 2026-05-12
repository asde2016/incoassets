import { validateMeta, makeSlug, type IconMeta } from '~/utils/svg/meta';
import { insertIcon } from '~/server/utils/repo/icons';

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as {
    name?: unknown;
    tags?: unknown;
    category?: unknown;
    description?: unknown;
    svg?: unknown;
  } | null;

  if (typeof body?.svg !== 'string' || !body.svg.startsWith('<svg')) {
    throw createError({ statusCode: 400, statusMessage: 'svg required' });
  }

  const metaResult = validateMeta({
    name: typeof body.name === 'string' ? body.name : '',
    tags: Array.isArray(body.tags) ? (body.tags as string[]) : [],
    category: typeof body.category === 'string' ? body.category : '',
    description: typeof body.description === 'string' ? body.description : '',
  });
  if (!metaResult.ok) {
    throw createError({
      statusCode: 422,
      statusMessage: metaResult.errors.join('; '),
    });
  }

  const {meta} = metaResult;
  const inserted = insertIcon({
    name: meta.name,
    slug: makeSlug(meta.name),
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
