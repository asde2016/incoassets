import { defineEventHandler, getQuery } from 'h3';
import { listIcons, type ListMode } from '~/server/utils/repo/icons';

export default defineEventHandler(event => {
  const q = getQuery(event);
  const offset = Number.parseInt(typeof q.offset === 'string' ? q.offset : '0', 10) || 0;
  const limit = Number.parseInt(typeof q.limit === 'string' ? q.limit : '60', 10) || 60;
  const search = typeof q.q === 'string' ? q.q : '';
  const mode: ListMode = q.deleted === 'true' || q.deleted === '1' ? 'deleted' : 'active';

  const result = listIcons({ q: search, offset, limit, mode });
  return {
    items: result.items.map(r => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      category: r.category,
      description: r.description,
      tags: JSON.parse(r.tagsJson),
      svg: r.svg,
      createdAt: r.createdAt,
      deletedAt: r.deletedAt,
      deletedReason: r.deletedReason,
    })),
    hasMore: result.hasMore,
  };
});
