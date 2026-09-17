import { z } from 'zod';

/**
 * Raw input schemas for public endpoints. These check shape and bounds only —
 * mobile/name *normalization* happens in the participants module after parsing,
 * because normalization needs to keep the original for display.
 */

export const startOrResumeSchema = z.object({
  // One field, not two: Persian names do not split reliably on whitespace, so
  // the participant writes their name as they write it and the server keeps it
  // whole. Bounds only here; normalization happens in the participants module.
  fullName: z
    .string()
    .min(1)
    .max(240)
    .transform((s) => s.trim()),
  mobile: z.string().min(1).max(40),
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
