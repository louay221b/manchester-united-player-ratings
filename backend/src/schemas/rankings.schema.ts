import { z } from 'zod';

const emptyStringToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

export const rankingQuerySchema = z.object({
  search: z.preprocess(emptyStringToUndefined, z.string().trim().max(120).optional()),
  position: z.preprocess(emptyStringToUndefined, z.string().trim().max(80).optional()),
  active: z
    .preprocess(emptyStringToUndefined, z.enum(['true', 'false']).optional())
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  minMatches: z
    .preprocess(emptyStringToUndefined, z.coerce.number().int().min(0).optional())
    .optional(),
});

export const adminStatisticsQuerySchema = rankingQuerySchema.extend({
  publishedOnly: z
    .preprocess(emptyStringToUndefined, z.enum(['true', 'false']).optional())
    .transform((value) => (value === undefined ? false : value === 'true')),
});

export type RankingQueryInput = z.infer<typeof rankingQuerySchema>;
export type AdminStatisticsQueryInput = z.infer<typeof adminStatisticsQuerySchema>;
