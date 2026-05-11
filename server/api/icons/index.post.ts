import { defineEventHandler, readBody, createError } from 'h3';
import { z } from 'zod';
import {
  parseUploadInput,
  validateAndNormalizeSvg,
  validateMeta,
  makeSlug,
} from '~/utils/svg/validate';
import { insertIcon } from '~/server/utils/repo/icons';

const BodySchema = z.object({
  name: z.string(),
  tags: z.array(z.string()).default([]),
  category: z.string().default(''),
  description: z.string().default(''),
  svg: z.string(),
});

export default defineEventHandler(async event => {
  const raw = await readBody(event);
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      data: { error: { code: 'INVALID_INPUT', message: parsed.error.message } },
    });
  }

  const meta = validateMeta({
    name: parsed.data.name,
    tags: parsed.data.tags,
    category: parsed.data.category,
    description: parsed.data.description,
  });
  if (!meta.ok) {
    throw createError({
      statusCode: 400,
      data: { error: { code: 'INVALID_INPUT', message: meta.errors.join('; ') } },
    });
  }

  const upload = parseUploadInput(parsed.data.svg);
  const svgValidation = validateAndNormalizeSvg(upload.svg);
  if (!svgValidation.ok) {
    throw createError({
      statusCode: 400,
      data: {
        error: { code: 'INVALID_SVG', message: svgValidation.errors.join('; ') },
      },
    });
  }

  const slug = makeSlug(meta.meta.name);
  const inserted = insertIcon({
    name: meta.meta.name,
    slug,
    category: meta.meta.category,
    description: meta.meta.description,
    tags: meta.meta.tags,
    svg: svgValidation.svg,
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
