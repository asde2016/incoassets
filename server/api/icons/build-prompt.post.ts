import { buildPrompt } from '~/server/utils/buildPrompt';

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as {
    keyword?: unknown;
    description?: unknown;
  } | null;
  const keyword = typeof body?.keyword === 'string' ? body.keyword.trim() : '';
  const description =
    typeof body?.description === 'string' ? body.description : undefined;

  if (!keyword) {
    throw createError({ statusCode: 400, statusMessage: 'keyword required' });
  }

  try {
    return buildPrompt({ keyword, description });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'buildPrompt failed';
    throw createError({ statusCode: 400, statusMessage: message });
  }
});