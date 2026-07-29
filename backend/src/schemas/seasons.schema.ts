import { z } from 'zod';

const isValidDateString = (value: string) => {
  const match = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/.exec(value);

  if (!match?.groups) {
    return false;
  }

  const year = Number(match.groups.year);
  const month = Number(match.groups.month);
  const day = Number(match.groups.day);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
};

const dateStringSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must use YYYY-MM-DD format',
  })
  .refine(isValidDateString, {
    message: 'Date must be valid',
  });

const validateDateOrder = (
  value: { startDate?: string; endDate?: string },
  context: z.RefinementCtx,
) => {
  if (value.startDate && value.endDate && value.endDate <= value.startDate) {
    context.addIssue({
      code: 'custom',
      path: ['endDate'],
      message: 'endDate must be after startDate',
    });
  }
};

const hasAtLeastOneField = (value: object) => Object.keys(value).length > 0;

export const seasonStatusSchema = z.enum(['draft', 'active', 'closed']);

export const createSeasonSchema = z
  .object({
    name: z
      .string()
      .trim()
      .regex(/^\d{4}\/\d{4}$/, {
        message: 'Season name should use YYYY/YYYY format',
      }),
    startDate: dateStringSchema,
    endDate: dateStringSchema,
    status: seasonStatusSchema,
  })
  .strict()
  .superRefine(validateDateOrder);

export const updateSeasonSchema = z
  .object({
    name: z
      .string()
      .trim()
      .regex(/^\d{4}\/\d{4}$/, {
        message: 'Season name should use YYYY/YYYY format',
      })
      .optional(),
    startDate: dateStringSchema.optional(),
    endDate: dateStringSchema.optional(),
    status: seasonStatusSchema.optional(),
  })
  .strict()
  .refine(hasAtLeastOneField, {
    message: 'At least one field must be provided',
  })
  .superRefine(validateDateOrder);

export type SeasonStatus = z.infer<typeof seasonStatusSchema>;
export type CreateSeasonInput = z.infer<typeof createSeasonSchema>;
export type UpdateSeasonInput = z.infer<typeof updateSeasonSchema>;
