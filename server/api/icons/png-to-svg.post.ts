import { pngToSvg } from '~/server/utils/pngToSvg';

const MAX_PAYLOAD = 10 * 1024 * 1024;

function parseBgHex(raw: string | undefined): '#FFFFFF' | '#000000' | undefined {
  if (!raw) return undefined;
  const v = raw.trim().toUpperCase();
  if (v === '#FFFFFF' || v === '#000000') return v;
  return undefined;
}

export default defineEventHandler(async (event) => {
  const parts = await readMultipartFormData(event);
  if (!parts || parts.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'multipart body required' });
  }

  const file = parts.find((p) => p.name === 'file' && p.data && p.data.length > 0);
  const baseHexPart = parts.find((p) => p.name === 'baseHex');
  const bgHexPart = parts.find((p) => p.name === 'backgroundHex');
  if (!file) {
    throw createError({ statusCode: 400, statusMessage: '"file" field required' });
  }
  if (file.data.length > MAX_PAYLOAD) {
    throw createError({ statusCode: 413, statusMessage: 'PNG too large (max 10 MB)' });
  }
  if (file.type && !file.type.startsWith('image/png')) {
    throw createError({ statusCode: 415, statusMessage: 'PNG only' });
  }
  const baseHex = baseHexPart?.data ? baseHexPart.data.toString('utf-8') : '#256BFA';
  const backgroundHex = parseBgHex(
    bgHexPart?.data ? bgHexPart.data.toString('utf-8') : undefined
  );

  let svg: string;
  try {
    svg = await pngToSvg(file.data, { baseHex, backgroundHex });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'pngToSvg failed';
    throw createError({ statusCode: 422, statusMessage: message });
  }
  return { svg };
});
