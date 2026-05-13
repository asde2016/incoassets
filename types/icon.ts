import { z } from 'zod';

// ============================================
// Bilingual primitives
// ============================================
export const BilingualSchema = z
  .object({
    ko: z.string(),
    en: z.string(),
  })
  .strict();
export type Bilingual = z.infer<typeof BilingualSchema>;

export const BilingualTagsSchema = z
  .object({
    ko: z.array(z.string()),
    en: z.array(z.string()),
  })
  .strict();
export type BilingualTags = z.infer<typeof BilingualTagsSchema>;

// ============================================
// Icon - Response (single)
// ============================================
// mutation 엔드포인트는 `message` 를 함께 반환 — useApi 가 자동으로 toast 표시.
// 목록 응답의 items[] 에는 안 들어가도 optional 이라 통과.
export const IconResponseSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
    category: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    svg: z.string(),
    createdAt: z.string(),
    deletedAt: z.string().nullable().optional(),
    deletedReason: z.string().nullable().optional(),
    message: z.string().optional(),
  })
  .passthrough();
export type IconResponse = z.infer<typeof IconResponseSchema>;

// ============================================
// Icon List - Response
// ============================================
export const IconListResponseSchema = z
  .object({
    items: z.array(IconResponseSchema),
    hasMore: z.boolean(),
  })
  .strict();
export type IconListResponse = z.infer<typeof IconListResponseSchema>;

// ============================================
// Icon List - Request (query params)
// ============================================
export const IconListRequestSchema = z.object({
  q: z.string().optional(),
  deleted: z.enum(['true', 'false']).optional(),
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(120).default(60),
});
export type IconListRequest = z.infer<typeof IconListRequestSchema>;

// ============================================
// Icon Create - Request (bilingual)
// ============================================
export const CreateIconRequestSchema = z
  .object({
    name: BilingualSchema,
    category: BilingualSchema,
    tags: BilingualTagsSchema,
    description: z.string().default(''),
    svg: z.string().min(1, 'svg 가 필요합니다.'),
  })
  .strict();
export type CreateIconRequest = z.infer<typeof CreateIconRequestSchema>;

// ============================================
// Icon Delete - Request
// ============================================
export const DeleteIconRequestSchema = z
  .object({
    reason: z.string({ required_error: '삭제 사유를 입력해주세요.' }).min(1, '삭제 사유를 입력해주세요.'),
  })
  .strict();
export type DeleteIconRequest = z.infer<typeof DeleteIconRequestSchema>;

// ============================================
// Suggest Meta - Request & Response
// ============================================
export const SuggestMetaRequestSchema = z
  .object({
    keyword: z.string().min(1, '키워드가 필요합니다.'),
    description: z.string().optional(),
  })
  .strict();
export type SuggestMetaRequest = z.infer<typeof SuggestMetaRequestSchema>;

export const SuggestMetaResponseSchema = z
  .object({
    name: BilingualSchema,
    category: BilingualSchema,
    tags: BilingualTagsSchema,
  })
  .strict();
export type SuggestMetaResponse = z.infer<typeof SuggestMetaResponseSchema>;

// ============================================
// Build Prompt - Request & Response
// ============================================
export const BuildPromptRequestSchema = z
  .object({
    keyword: z.string().min(1, '키워드가 필요합니다.'),
    description: z.string().optional(),
    name: BilingualSchema.optional(),
    category: BilingualSchema.optional(),
    tags: BilingualTagsSchema.optional(),
  })
  .strict();
export type BuildPromptRequest = z.infer<typeof BuildPromptRequestSchema>;

export const BuildPromptResponseSchema = z
  .object({
    prompt: z.string(),
  })
  .strict();
export type BuildPromptResponse = z.infer<typeof BuildPromptResponseSchema>;

// ============================================
// PNG → SVG - Response (요청은 multipart/form-data 라 별도 스키마 없음)
// ============================================
export const PngToSvgResponseSchema = z
  .object({
    svg: z.string(),
  })
  .strict();
export type PngToSvgResponse = z.infer<typeof PngToSvgResponseSchema>;

// ============================================
// Delete / Restore - Response (`{ ok: true, message? }`)
// ============================================
export const OkResponseSchema = z
  .object({
    ok: z.boolean(),
    message: z.string().optional(),
  })
  .strict();
export type OkResponse = z.infer<typeof OkResponseSchema>;

// ============================================
// Search Mode (active / deleted)
// ============================================
export type SearchMode = 'active' | 'deleted';
