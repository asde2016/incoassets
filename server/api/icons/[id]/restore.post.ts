import { defineEventHandler, getRouterParam, createError } from 'h3';
import { restoreIcon } from '~/server/utils/repo/icons';

export default defineEventHandler(event => {
  const idParam = getRouterParam(event, 'id') ?? '';
  const id = Number.parseInt(idParam, 10);
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      data: { error: { code: 'INVALID_INPUT', message: 'invalid id' } },
    });
  }
  const ok = restoreIcon(id);
  if (!ok) {
    throw createError({
      statusCode: 404,
      data: { error: { code: 'NOT_FOUND', message: 'icon not found or already active' } },
    });
  }
  return { ok: true, message: '복구를 완료했습니다.' };
});
