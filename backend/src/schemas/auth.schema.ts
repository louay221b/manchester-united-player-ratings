import { z } from 'zod';

export const updateOwnProfileSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100),
  })
  .strict();

export type UpdateOwnProfileInput = z.infer<typeof updateOwnProfileSchema>;
