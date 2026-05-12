import { suggestMeta } from '~/server/utils/suggestMeta';

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
    return await suggestMeta({ keyword, description });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'suggestMeta failed';
    // 502: 외부 Ollama 호출 실패. 호출부가 silent fallback 하도록 4xx 가 아닌 5xx 로.
    throw createError({ statusCode: 502, statusMessage: message });
  }
});
