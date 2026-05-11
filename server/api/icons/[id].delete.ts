// server/api/icons/[id].delete.ts
import { defineEventHandler, getRouterParam, readBody, createError } from 'h3';
import { softDeleteIcon } from '~/server/utils/repo/icons';

export default defineEventHandler(async event => {
  const idParam = getRouterParam(event, 'id') ?? '';
  const id = Number.parseInt(idParam, 10);
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      data: { error: { code: 'INVALID_INPUT', message: 'invalid id' } },
    });
  }

  const body = (await readBody<{ reason?: string }>(event)) ?? {};
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  if (reason.length === 0) {
    throw createError({
      statusCode: 400,
      data: { error: { code: 'INVALID_INPUT', message: 'reason required' } },
    });
  }

  const ok = softDeleteIcon(id, reason);
  if (!ok) {
    throw createError({
      statusCode: 404,
      data: { error: { code: 'NOT_FOUND', message: 'icon not found' } },
    });
  }
  return { ok: true };
});
