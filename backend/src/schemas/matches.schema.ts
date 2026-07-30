import { z } from 'zod';

const isValidDateTime = (value: string) => !Number.isNaN(Date.parse(value));
const hasAtLeastOneField = (value: object) => Object.keys(value).length > 0;
const emptyStringToNull = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? null : value;

const optionalNullableUrlSchema = z.preprocess(
  emptyStringToNull,
  z.string().trim().url().max(500).nullable().optional(),
);

const optionalCreateStoragePathSchema = z.preprocess(emptyStringToNull, z.null().optional());

const optionalNullableStoragePathSchema = z.preprocess(
  emptyStringToNull,
  z
    .string()
    .trim()
    .min(1)
    .max(300)
    .refine((value) => !value.includes('..'), {
      message: 'opponentLogoPath must not contain parent directory segments',
    })
    .refine((value) => !value.startsWith('/') && !value.includes('\\'), {
      message: 'opponentLogoPath must be a relative storage path',
    })
    .nullable()
    .optional(),
);

const matchDateSchema = z.string().trim().refine(isValidDateTime, {
  message: 'matchDate must be a valid date-time',
});

const nullableMinuteSchema = z.preprocess(
  emptyStringToNull,
  z.coerce.number().int().min(0).max(130).nullable(),
);

export const matchStatusSchema = z.enum(['scheduled', 'finished', 'cancelled']);
export const votingStatusSchema = z.enum(['closed', 'open', 'completed']);
export const participationStatusSchema = z.enum([
  'starter',
  'substitute_entered',
  'substitute_unused',
]);

export const matchQuerySchema = z.object({
  seasonId: z.string().trim().optional(),
  status: matchStatusSchema.optional(),
  votingStatus: votingStatusSchema.optional(),
  competition: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createMatchSchema = z
  .object({
    seasonId: z.string().uuid(),
    opponentName: z.string().trim().min(1).max(120),
    opponentLogoUrl: optionalNullableUrlSchema.default(null),
    opponentLogoPath: optionalCreateStoragePathSchema.default(null),
    competition: z.string().trim().min(1).max(120),
    matchDate: matchDateSchema,
    venue: z.string().trim().min(1).max(160).nullable(),
    isHome: z.boolean(),
  })
  .strict();

export const updateMatchSchema = z
  .object({
    seasonId: z.string().uuid().optional(),
    opponentName: z.string().trim().min(1).max(120).optional(),
    opponentLogoUrl: optionalNullableUrlSchema,
    opponentLogoPath: optionalNullableStoragePathSchema,
    competition: z.string().trim().min(1).max(120).optional(),
    matchDate: matchDateSchema.optional(),
    venue: z.preprocess(emptyStringToNull, z.string().trim().min(1).max(160).nullable()).optional(),
    isHome: z.boolean().optional(),
  })
  .strict()
  .refine(hasAtLeastOneField, {
    message: 'At least one field must be provided',
  });

export const lineupPlayerSchema = z
  .object({
    playerId: z.string().uuid(),
    participationStatus: participationStatusSchema,
    enteredMinute: nullableMinuteSchema,
    exitedMinute: nullableMinuteSchema,
    minutesPlayed: z.coerce.number().int().min(0).max(130),
    eligibleForRating: z.boolean(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.enteredMinute !== null &&
      value.exitedMinute !== null &&
      value.exitedMinute < value.enteredMinute
    ) {
      context.addIssue({
        code: 'custom',
        path: ['exitedMinute'],
        message: 'exitedMinute must be greater than or equal to enteredMinute',
      });
    }

    if (value.participationStatus === 'substitute_unused') {
      if (value.minutesPlayed !== 0) {
        context.addIssue({
          code: 'custom',
          path: ['minutesPlayed'],
          message: 'substitute_unused must have 0 minutes played',
        });
      }

      if (value.eligibleForRating) {
        context.addIssue({
          code: 'custom',
          path: ['eligibleForRating'],
          message: 'substitute_unused must not be eligible for rating',
        });
      }

      if (value.enteredMinute !== null || value.exitedMinute !== null) {
        context.addIssue({
          code: 'custom',
          path: ['enteredMinute'],
          message: 'substitute_unused must not have entered or exited minutes',
        });
      }
    }

    if (value.participationStatus !== 'substitute_unused' && value.minutesPlayed <= 0) {
      context.addIssue({
        code: 'custom',
        path: ['minutesPlayed'],
        message: 'A participant must have minutesPlayed greater than 0',
      });
    }
  });

export const replaceLineupSchema = z
  .object({
    players: z.array(lineupPlayerSchema).min(1),
  })
  .strict()
  .superRefine((value, context) => {
    const playerIds = new Set<string>();

    value.players.forEach((player, index) => {
      if (playerIds.has(player.playerId)) {
        context.addIssue({
          code: 'custom',
          path: ['players', index, 'playerId'],
          message: 'A player can appear only once in a lineup',
        });
      }

      playerIds.add(player.playerId);
    });
  });

export const finishMatchSchema = z
  .object({
    manchesterUnitedScore: z.coerce.number().int().min(0),
    opponentScore: z.coerce.number().int().min(0),
  })
  .strict();

export type MatchStatus = z.infer<typeof matchStatusSchema>;
export type VotingStatus = z.infer<typeof votingStatusSchema>;
export type ParticipationStatus = z.infer<typeof participationStatusSchema>;
export type MatchQueryInput = z.infer<typeof matchQuerySchema>;
export type CreateMatchInput = z.infer<typeof createMatchSchema>;
export type UpdateMatchInput = z.infer<typeof updateMatchSchema>;
export type ReplaceLineupInput = z.infer<typeof replaceLineupSchema>;
export type LineupPlayerInput = z.infer<typeof lineupPlayerSchema>;
export type FinishMatchInput = z.infer<typeof finishMatchSchema>;
