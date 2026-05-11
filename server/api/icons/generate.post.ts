import { defineEventHandler, readBody, createError } from 'h3';
import { z } from 'zod';
import { generateMany } from '~/server/utils/iconCompose';

const BodySchema = z.object({
  keyword: z.string().min(1),
  description: z.string().default(''),
  count: z.number().int().min(1).max(8).default(3),
});

export default defineEventHandler(async (event) => {
  const raw = await readBody(event);
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      data: { error: { code: 'INVALID_INPUT', message: parsed.error.message } },
    });
  }
  try {
    const items = await generateMany(
      parsed.data.keyword.trim(),
      parsed.data.description.trim(),
      parsed.data.count,
    );
    return { items };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw createError({
      statusCode: 500,
      data: { error: { code: 'GENERATE_FAILED', message } },
    });
  }
});