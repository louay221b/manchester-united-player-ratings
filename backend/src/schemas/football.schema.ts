import { z } from 'zod';

export const cronFootballSyncSchema = z
  .object({
    mode: z.enum(['fixtures', 'live']),
  })
  .strict();

export type CronFootballSyncInput = z.infer<typeof cronFootballSyncSchema>;
