import { z } from 'zod';

const emptyStringToNull = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? null : value;

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

const textFieldSchema = z.string().trim().min(1).max(80);

const nullableDateSchema = z.preprocess(
  emptyStringToNull,
  z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: 'Date must use YYYY-MM-DD format',
    })
    .refine(isValidDateString, {
      message: 'Date must be valid',
    })
    .nullable(),
);

const nullablePhotoUrlSchema = z.preprocess(
  emptyStringToNull,
  z.string().trim().url().max(500).nullable(),
);

const nullableCreatePhotoPathSchema = z.preprocess(emptyStringToNull, z.null().optional());

const nullableStoragePathSchema = z.preprocess(
  emptyStringToNull,
  z
    .string()
    .trim()
    .min(1)
    .max(300)
    .refine((value) => !value.includes('..'), {
      message: 'photoPath must not contain parent directory segments',
    })
    .refine((value) => !value.startsWith('/') && !value.includes('\\'), {
      message: 'photoPath must be a relative storage path',
    })
    .nullable(),
);

const nullableShirtNumberSchema = z.preprocess(
  emptyStringToNull,
  z.coerce.number().int().min(1).max(99).nullable(),
);

const validatePlayerDates = (
  value: { joinedAt?: string | null; leftAt?: string | null },
  context: z.RefinementCtx,
) => {
  if (value.joinedAt && value.leftAt && value.leftAt < value.joinedAt) {
    context.addIssue({
      code: 'custom',
      path: ['leftAt'],
      message: 'leftAt must not be before joinedAt',
    });
  }
};

const hasAtLeastOneField = (value: object) => Object.keys(value).length > 0;

export const createPlayerSchema = z
  .object({
    firstName: textFieldSchema,
    lastName: textFieldSchema,
    shirtNumber: nullableShirtNumberSchema,
    position: textFieldSchema,
    photoUrl: nullablePhotoUrlSchema,
    photoPath: nullableCreatePhotoPathSchema.default(null),
    active: z.boolean(),
    joinedAt: nullableDateSchema,
    leftAt: nullableDateSchema,
  })
  .strict()
  .superRefine(validatePlayerDates);

export const updatePlayerSchema = z
  .object({
    firstName: textFieldSchema.optional(),
    lastName: textFieldSchema.optional(),
    shirtNumber: nullableShirtNumberSchema.optional(),
    position: textFieldSchema.optional(),
    photoUrl: nullablePhotoUrlSchema.optional(),
    photoPath: nullableStoragePathSchema.optional(),
    active: z.boolean().optional(),
    joinedAt: nullableDateSchema.optional(),
    leftAt: nullableDateSchema.optional(),
  })
  .strict()
  .refine(hasAtLeastOneField, {
    message: 'At least one field must be provided',
  })
  .superRefine(validatePlayerDates);

export const playerStatusSchema = z
  .object({
    active: z.boolean(),
  })
  .strict();

export const playerQuerySchema = z.object({
  search: z.string().trim().optional(),
  position: z.string().trim().optional(),
  active: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;
export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;
export type PlayerStatusInput = z.infer<typeof playerStatusSchema>;
export type PlayerQueryInput = z.infer<typeof playerQuerySchema>;
