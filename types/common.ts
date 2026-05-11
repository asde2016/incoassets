import { z } from 'zod';

// ============================================
// Common - Message Response
// ============================================
export const MessageResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
  })
  .strict();
export type MessageResponse = z.infer<typeof MessageResponseSchema>;
