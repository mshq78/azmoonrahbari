import { z } from 'zod';

/**
 * Raw input schemas for public endpoints. These check shape and bounds only —
 * mobile/name *normalization* happens in the participants module after parsing,
 * because normalization needs to keep the original for display.
 */

const trimmedName = z
  .string()
  .min(1)
  .max(120)
  .transform((s) => s.trim());

export const startOrResumeSchema = z.object({
  firstName: trimmedName,
  lastName: trimmedName,
  mobile: z.string().min(1).max(40),
  orgCode: z
    .string()
    .max(64)
    .transform((s) => s.trim())
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

export const questionIdParamSchema = z.object({
  questionId: z.coerce.number().int().positive(),
});

export const saveAnswerSchema = z.object({
  selectedOptionId: z.coerce.number().int().positive(),
  clientMutationId: z.string().min(1).max(64),
});

export const finalizeSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.coerce.number().int().positive(),
        selectedOptionId: z.coerce.number().int().positive(),
      }),
    )
    .min(1)
    .max(200),
});

export type StartOrResumeInput = z.infer<typeof startOrResumeSchema>;
export type SaveAnswerInput = z.infer<typeof saveAnswerSchema>;
export type FinalizeInput = z.infer<typeof finalizeSchema>;
