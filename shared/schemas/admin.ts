import { z } from 'zod';
import { ATTEMPT_STATUSES, CHARACTER_CODES, PAGINATION } from '../contracts/constants';

export const adminLoginSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(256),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION.maxPageSize)
    .default(PAGINATION.defaultPageSize),
});

export const participantsQuerySchema = paginationSchema.extend({
  q: z.string().max(120).optional(),
  status: z.enum(ATTEMPT_STATUSES).optional(),
  versionId: z.coerce.number().int().positive().optional(),
  orgCode: z.string().max(64).optional(),
});

export const createQuestionSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(32)
    .regex(/^[A-Za-z0-9_-]+$/, 'code must be alphanumeric'),
  text: z.string().min(1).max(2000),
  displayOrder: z.coerce.number().int().min(1).max(999).optional(),
  isTieBreaker: z.boolean().default(false),
});

export const updateQuestionSchema = z
  .object({
    text: z.string().min(1).max(2000).optional(),
    displayOrder: z.coerce.number().int().min(1).max(999).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'no fields to update' });

export const reorderQuestionsSchema = z.object({
  orderedQuestionIds: z.array(z.coerce.number().int().positive()).min(1).max(200),
});

export const createOptionSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(32)
    .regex(/^[A-Za-z0-9_-]+$/, 'code must be alphanumeric'),
  text: z.string().min(1).max(2000),
  displayOrder: z.coerce.number().int().min(1).max(999).optional(),
  internalValue: z.enum(CHARACTER_CODES),
  score: z.coerce.number().min(0).max(999).default(1),
});

export const updateOptionSchema = z
  .object({
    text: z.string().min(1).max(2000).optional(),
    displayOrder: z.coerce.number().int().min(1).max(999).optional(),
    internalValue: z.enum(CHARACTER_CODES).optional(),
    score: z.coerce.number().min(0).max(999).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'no fields to update' });

export const attachImageSchema = z.object({
  mediaAssetId: z.coerce.number().int().positive(),
});

export const exportQuerySchema = z.object({
  status: z.enum(ATTEMPT_STATUSES).optional(),
  versionId: z.coerce.number().int().positive().optional(),
  orgCode: z.string().max(64).optional(),
});

export const mediaQuerySchema = paginationSchema;

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type ParticipantsQuery = z.infer<typeof participantsQuerySchema>;
