import { pngToSvg } from '~/server/utils/pngToSvg';

const MAX_PAYLOAD = 10 * 1024 * 1024;

export default defineEventHandler(async (event) => {
  const parts = await readMultipartFormData(event);
  if (!parts || parts.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'multipart body required' });
  }

  const file = parts.find((p) => p.name === 'file' && p.data && p.data.length > 0);
  const baseHexPart = parts.find((p) => p.name === 'baseHex');
  const strokeHexPart = parts.find((p) => p.name === 'strokeHex');
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
  const strokeHexRaw = strokeHexPart?.data
    ? strokeHexPart.data.toString('utf-8').trim()
    : '';
  const strokeHex = strokeHexRaw.length > 0 ? strokeHexRaw : undefined;

  let svg: string;
  try {
    svg = await pngToSvg(file.data, { baseHex, strokeHex });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'pngToSvg failed';
    throw createError({ statusCode: 422, statusMessage: message });
  }
  return { svg };
});
