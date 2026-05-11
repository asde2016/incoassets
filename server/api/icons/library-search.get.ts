import { defineEventHandler, getQuery } from 'h3';
import { searchIcons } from '~/server/utils/iconIndex';

export default defineEventHandler((event) => {
  const q = getQuery(event);
  const query = typeof q.q === 'string' ? q.q : '';
  const set = typeof q.set === 'string' && q.set.length > 0 ? q.set : undefined;
  const limitRaw = Number(q.limit);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(120, Math.floor(limitRaw))) : 48;

  if (!query.trim()) return { items: [] };
  const items = searchIcons(query, limit, set);
  return { items };
});