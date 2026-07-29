import { z } from 'zod';

const ratingSchema = z
  .number()
  .min(1)
  .max(10)
  .refine((value) => Number.isInteger(value * 2), {
    message: 'Rating must use a 0.5 step',
  });

export const ballotRatingSchema = z
  .object({
    playerId: z.string().uuid(),
    rating: ratingSchema,
  })
  .strict();

export const submitBallotSchema = z
  .object({
    ratings: z.array(ballotRatingSchema).min(1),
    manOfTheMatchPlayerId: z.string().uuid(),
  })
  .strict()
  .superRefine((value, context) => {
    const playerIds = new Set<string>();

    value.ratings.forEach((rating, index) => {
      if (playerIds.has(rating.playerId)) {
        context.addIssue({
          code: 'custom',
          path: ['ratings', index, 'playerId'],
          message: 'A player can appear only once in a ballot',
        });
      }

      playerIds.add(rating.playerId);
    });
  });

export type SubmitBallotInput = z.infer<typeof submitBallotSchema>;
