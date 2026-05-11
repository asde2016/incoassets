import { z } from 'zod';

// ============================================
// Post - Response
// ============================================
export const PostResponseSchema = z
  .object({
    id: z.number(),
    title: z.string(),
    content: z.string().nullable(),
    author: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .strict();
export type PostResponse = z.infer<typeof PostResponseSchema>;

// ============================================
// Post List - Response
// ============================================
export const PostListResponseSchema = z.array(PostResponseSchema);
export type PostListResponse = z.infer<typeof PostListResponseSchema>;

// ============================================
// Post Create - Request
// ============================================
export const CreatePostRequestSchema = z
  .object({
    title: z.string({ required_error: '제목을 입력해주세요.' }).min(1, '제목을 입력해주세요.'),
    content: z.string({ required_error: '내용을 입력해주세요.' }).min(1, '내용을 입력해주세요.'),
  })
  .strict();
export type CreatePostRequest = z.infer<typeof CreatePostRequestSchema>;

// ============================================
// Post Update - Request
// ============================================
export const UpdatePostRequestSchema = CreatePostRequestSchema;
export type UpdatePostRequest = z.infer<typeof UpdatePostRequestSchema>;
