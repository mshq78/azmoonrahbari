import { Router } from 'express';
import multer from 'multer';
import {
  adminLoginSchema,
  attachImageSchema,
  createOptionSchema,
  createQuestionSchema,
  exportQuerySchema,
  idParamSchema,
  mediaQuerySchema,
  participantsQuerySchema,
  reorderQuestionsSchema,
  updateOptionSchema,
  updateQuestionSchema,
} from '../../../../shared/schemas/admin';
import type { AdminLoginResponse, AdminMeResponse } from '../../../../shared/types/admin-api';
import { env } from '../../config/index';
import { asyncHandler } from '../../middleware/asyncHandler';
import { adminCsrf } from '../../middleware/csrf';
import { adminLoginLimiter, mediaUploadLimiter } from '../../middleware/rateLimit';
import { parseBody, parseParams, parseQuery } from '../../middleware/validate';
import { badRequest, ERROR_CODES, unauthenticated } from '../../shared/errors';
import {
  authenticateAdmin,
  clearAdminSessionCookies,
  createAdminSession,
  requireAdmin,
  revokeAdminSession,
} from '../auth/service';
import { buildAttemptsCsv } from '../exports/csv';
import {
  createMediaAsset,
  deleteMediaAsset,
  listMediaAssets,
} from '../media/service';
import {
  createOption,
  createQuestion,
  getAdminQuestion,
  listAdminQuestions,
  reorderQuestions,
  setOptionImage,
  setQuestionImage,
  updateOption,
  updateQuestion,
} from './content';
import { getDashboard, listCharacters } from './dashboard';
import {
  deleteParticipant,
  getAttemptDetail,
  listAttempts,
  reopenAttempt,
} from './participants';
import { cloneActiveVersion, listVersions, publishVersion } from './versions';

export const adminRouter: Router = Router();

// Files are held in memory so the bytes can be sniffed before anything is
// written to disk; MAX_UPLOAD_BYTES bounds how much that can be.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_BYTES, files: 1 },
});

adminRouter.post(
  '/login',
  adminLoginLimiter,
  asyncHandler(async (req, res) => {
    const input = parseBody(adminLoginSchema, req);
    const admin = await authenticateAdmin(input.username, input.password);
    if (!admin) {
      throw unauthenticated(ERROR_CODES.INVALID_CREDENTIALS);
    }

    const session = await createAdminSession(res, admin, req);
    const body: AdminLoginResponse = {
      admin: {
        id: admin.id,
        username: admin.username,
        displayName: admin.displayName,
        lastLoginAt: null,
      },
      csrfToken: session.csrfToken,
    };
    res.json(body);
  }),
);

adminRouter.post(
  '/logout',
  requireAdmin,
  adminCsrf,
  asyncHandler(async (req, res) => {
    await revokeAdminSession(req.adminSession!.session.id);
    clearAdminSessionCookies(res);
    res.json({ ok: true });
  }),
);

adminRouter.get(
  '/me',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { admin, session } = req.adminSession!;
    const body: AdminMeResponse = {
      admin: {
        id: admin.id,
        username: admin.username,
        displayName: admin.displayName,
        lastLoginAt: admin.lastLoginAt ? admin.lastLoginAt.toISOString() : null,
      },
      csrfToken: session.csrfToken,
    };
    res.json(body);
  }),
);

adminRouter.use(requireAdmin, adminCsrf);

adminRouter.get(
  '/dashboard',
  asyncHandler(async (_req, res) => {
    res.json(await getDashboard());
  }),
);

adminRouter.get(
  '/characters',
  asyncHandler(async (_req, res) => {
    res.json({ items: await listCharacters() });
  }),
);

// ---------------------------------------------------------------- versions

adminRouter.get(
  '/versions',
  asyncHandler(async (_req, res) => {
    res.json({ items: await listVersions() });
  }),
);

adminRouter.post(
  '/versions/clone-active',
  asyncHandler(async (_req, res) => {
    const version = await cloneActiveVersion();
    res.status(201).json({ id: version.id, versionNumber: version.versionNumber });
  }),
);

adminRouter.post(
  '/versions/:id/publish',
  asyncHandler(async (req, res) => {
    const { id } = parseParams(idParamSchema, req);
    const version = await publishVersion(id);
    res.json({ id: version.id, versionNumber: version.versionNumber, status: version.status });
  }),
);

// --------------------------------------------------------------- questions

adminRouter.get(
  '/versions/:id/questions',
  asyncHandler(async (req, res) => {
    const { id } = parseParams(idParamSchema, req);
    res.json({ items: await listAdminQuestions(id) });
  }),
);

adminRouter.post(
  '/versions/:id/questions',
  asyncHandler(async (req, res) => {
    const { id } = parseParams(idParamSchema, req);
    const input = parseBody(createQuestionSchema, req);
    res.status(201).json(await createQuestion(id, input));
  }),
);

adminRouter.post(
  '/versions/:id/questions/reorder',
  asyncHandler(async (req, res) => {
    const { id } = parseParams(idParamSchema, req);
    const { orderedQuestionIds } = parseBody(reorderQuestionsSchema, req);
    res.json({ items: await reorderQuestions(id, orderedQuestionIds) });
  }),
);

adminRouter.patch(
  '/questions/:id',
  asyncHandler(async (req, res) => {
    const { id } = parseParams(idParamSchema, req);
    const input = parseBody(updateQuestionSchema, req);
    res.json(await updateQuestion(id, input));
  }),
);

/** Preview returns exactly what the participant would see for this question. */
adminRouter.get(
  '/questions/:id/preview',
  asyncHandler(async (req, res) => {
    const { id } = parseParams(idParamSchema, req);
    const question = await getAdminQuestion(id);
    res.json({
      id: question.id,
      code: question.code,
      text: question.text,
      imageUrl: question.imageUrl,
      options: question.options
        .filter((option) => option.isActive)
        .map((option) => ({
          id: option.id,
          code: option.code,
          text: option.text,
          imageUrl: option.imageUrl,
        })),
    });
  }),
);

adminRouter.put(
  '/questions/:id/image',
  asyncHandler(async (req, res) => {
    const { id } = parseParams(idParamSchema, req);
    const { mediaAssetId } = parseBody(attachImageSchema, req);
    res.json(await setQuestionImage(id, mediaAssetId));
  }),
);

adminRouter.delete(
  '/questions/:id/image',
  asyncHandler(async (req, res) => {
    const { id } = parseParams(idParamSchema, req);
    res.json(await setQuestionImage(id, null));
  }),
);

// ----------------------------------------------------------------- options

adminRouter.post(
  '/questions/:id/options',
  asyncHandler(async (req, res) => {
    const { id } = parseParams(idParamSchema, req);
    const input = parseBody(createOptionSchema, req);
    res.status(201).json(await createOption(id, input));
  }),
);

adminRouter.patch(
  '/options/:id',
  asyncHandler(async (req, res) => {
    const { id } = parseParams(idParamSchema, req);
    const input = parseBody(updateOptionSchema, req);
    res.json(await updateOption(id, input));
  }),
);

adminRouter.put(
  '/options/:id/image',
  asyncHandler(async (req, res) => {
    const { id } = parseParams(idParamSchema, req);
    const { mediaAssetId } = parseBody(attachImageSchema, req);
    res.json(await setOptionImage(id, mediaAssetId));
  }),
);

adminRouter.delete(
  '/options/:id/image',
  asyncHandler(async (req, res) => {
    const { id } = parseParams(idParamSchema, req);
    res.json(await setOptionImage(id, null));
  }),
);

// ------------------------------------------------- participants & attempts

adminRouter.get(
  '/participants',
  asyncHandler(async (req, res) => {
    const query = parseQuery(participantsQuerySchema, req);
    res.json(
      await listAttempts(
        {
          q: query.q,
          status: query.status,
          versionId: query.versionId,
          orgCode: query.orgCode,
        },
        query.page,
        query.pageSize,
      ),
    );
  }),
);

adminRouter.delete(
  '/participants/:id',
  asyncHandler(async (req, res) => {
    const { id } = parseParams(idParamSchema, req);
    res.json(await deleteParticipant(id));
  }),
);

adminRouter.get(
  '/attempts/:id',
  asyncHandler(async (req, res) => {
    const { id } = parseParams(idParamSchema, req);
    res.json(await getAttemptDetail(id));
  }),
);

adminRouter.post(
  '/attempts/:id/reopen',
  asyncHandler(async (req, res) => {
    const { id } = parseParams(idParamSchema, req);
    res.json(await reopenAttempt(id));
  }),
);

// ------------------------------------------------------------------ export

adminRouter.get(
  '/exports/attempts.csv',
  asyncHandler(async (req, res) => {
    const query = parseQuery(exportQuerySchema, req);
    const csv = await buildAttemptsCsv(query);

    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="attempts-${stamp}.csv"`);
    res.send(csv);
  }),
);

// ------------------------------------------------------------------- media

adminRouter.get(
  '/media',
  asyncHandler(async (req, res) => {
    const query = parseQuery(mediaQuerySchema, req);
    res.json(await listMediaAssets(query.page, query.pageSize));
  }),
);

adminRouter.post(
  '/media',
  mediaUploadLimiter,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file) throw badRequest(ERROR_CODES.VALIDATION_ERROR);

    res.status(201).json(
      await createMediaAsset({
        buffer: file.buffer,
        mimeType: file.mimetype,
        originalName: file.originalname,
        adminId: req.adminSession!.admin.id,
      }),
    );
  }),
);

adminRouter.delete(
  '/media/:id',
  asyncHandler(async (req, res) => {
    const { id } = parseParams(idParamSchema, req);
    res.json(await deleteMediaAsset(id));
  }),
);
