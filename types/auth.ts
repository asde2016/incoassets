import { z } from 'zod';

// ============================================
// Login - Request & Response
// ============================================
export const LoginRequestSchema = z
  .object({
    username: z
      .string({ required_error: '사용자 ID를 입력해주세요.' })
      .min(1, '사용자 ID를 입력해주세요.'),
    password: z
      .string({ required_error: '비밀번호를 입력해주세요.' })
      .min(1, '비밀번호를 입력해주세요.'),
  })
  .strict();
export const LoginResponseSchema = z
  .object({
    message: z.string(),
    user: z.object({
      id: z.number(),
      permission: z.number(),
      nickname: z.string(),
      profile_image_path: z.string().nullable(),
    }),
  })
  .strict();
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

// ============================================
// Refresh - Response
// ============================================
export const RefreshResponseSchema = z
  .object({
    message: z.string(),
    user: z.object({
      id: z.number(),
      permission: z.number(),
      nickname: z.string(),
      profile_image_path: z.string().nullable(),
    }),
  })
  .strict();
export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;
