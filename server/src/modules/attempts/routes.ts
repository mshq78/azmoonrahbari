import { Router } from 'express';
import { IDEMPOTENCY_HEADER } from '../../../../shared/contracts/constants';
import {
  finalizeSchema,
  questionIdParamSchema,
  saveAnswerSchema,
  startOrResumeSchema,
} from '../../../../shared/schemas/public';
import type {
  PublicConfigResponse,
  ResultResponse,
} from '../../../../shared/types/public-api';
import type { CharacterCode } from '../../../../shared/contracts/constants';
import { asyncHandler } from '../../middleware/asyncHandler';
import { participantCsrf } from '../../middleware/csrf';
import { finalizeLimiter, startOrResumeLimiter } from '../../middleware/rateLimit';
import {
  clearParticipantSession,
  issueParticipantSession,
  loadParticipantSession,
  requireParticipantSession,
} from '../../middleware/session';
import { parseBody, parseParams } from '../../middleware/validate';
import { badRequest, conflict, ERROR_CODES, notFound } from '../../shared/errors';
import { toIsoRequired } from '../../shared/time';
import { saveAnswer } from '../answers/service';
import { getActiveVersion } from '../questionnaire/repository';
import { buildBootstrap } from './bootstrap';
import { finalizeAttempt } from './finalize';
import { getAttemptById } from './repository';
import { startOrResume } from './start-or-resume';

export const publicRouter: Router = Router();

/**
 * Lets the entry screen disable registration before asking for any details,
 * without revealing anything about the admin side.
 */
publicRouter.get(
  '/config',
  asyncHandler(async (_req, res) => {
    const version = await getActiveVersion();
    const body: PublicConfigResponse = {
      registrationOpen: version !== null,
      versionNumber: version?.versionNumber ?? null,
    };
    res.json(body);
  }),
);

publicRouter.post(
  '/attempts/start-or-resume',
  startOrResumeLimiter,
  asyncHandler(async (req, res) => {
    const input = parseBody(startOrResumeSchema, req);
    const attempt = await startOrResume(input);

    // A fresh CSRF token on every start, bound to the newly issued session.
    const csrfToken = issueParticipantSession(res, {
      attemptId: attempt.id,
      participantId: attempt.participantId,
    });

    res.json(await buildBootstrap(attempt, csrfToken));
  }),
);

publicRouter.get(
  '/attempts/current/bootstrap',
  requireParticipantSession,
  asyncHandler(async (req, res) => {
    const session = req.participantSession!;
    const attempt = await getAttemptById(session.attemptId);
    if (!attempt || attempt.participantId !== session.participantId) {
      clearParticipantSession(res);
      throw notFound(ERROR_CODES.ATTEMPT_NOT_FOUND);
    }
    res.json(await buildBootstrap(attempt, session.csrfToken));
  }),
);

publicRouter.put(
  '/attempts/current/answers/:questionId',
  requireParticipantSession,
  participantCsrf,
  asyncHandler(async (req, res) => {
    const session = req.participantSession!;
    const { questionId } = parseParams(questionIdParamSchema, req);
    const body = parseBody(saveAnswerSchema, req);

    const result = await saveAnswer({
      attemptId: session.attemptId,
      questionId,
      selectedOptionId: body.selectedOptionId,
      clientMutationId: body.clientMutationId,
    });

    res.json(result);
  }),
);

publicRouter.post(
  '/attempts/current/finalize',
  requireParticipantSession,
  participantCsrf,
  finalizeLimiter,
  asyncHandler(async (req, res) => {
    const session = req.participantSession!;

    const idempotencyKey = req.get(IDEMPOTENCY_HEADER);
    if (!idempotencyKey || idempotencyKey.length > 128) {
      throw badRequest(ERROR_CODES.IDEMPOTENCY_KEY_REQUIRED);
    }

    const body = parseBody(finalizeSchema, req);
    const outcome = await finalizeAttempt({
      attemptId: session.attemptId,
      idempotencyKey,
      answers: body.answers,
    });

    res.status(outcome.status).json(outcome.body);
  }),
);

publicRouter.get(
  '/attempts/current/result',
  requireParticipantSession,
  asyncHandler(async (req, res) => {
    const session = req.participantSession!;
    const attempt = await getAttemptById(session.attemptId);
    if (!attempt || attempt.participantId !== session.participantId) {
      throw notFound(ERROR_CODES.ATTEMPT_NOT_FOUND);
    }

    if (
      attempt.status !== 'Completed' ||
      !attempt.trackingCode ||
      !attempt.completedAt ||
      !attempt.resultCharacterCode
    ) {
      // An admin reopen lands here; the client sends the participant back to review.
      throw conflict(ERROR_CODES.ATTEMPT_NOT_COMPLETED);
    }

    const body: ResultResponse = {
      status: attempt.status,
      trackingCode: attempt.trackingCode,
      completedAt: toIsoRequired(attempt.completedAt),
      result: { characterCode: attempt.resultCharacterCode as CharacterCode },
    };
    res.json(body);
  }),
);

/**
 * Logout only clears this browser's own cookies, so a stale or missing session
 * must still succeed. CSRF is enforced only when there is a live session to protect.
 */
publicRouter.post(
  '/session/logout',
  loadParticipantSession,
  (req, res, next) => {
    if (!req.participantSession) {
      next();
      return;
    }
    participantCsrf(req, res, next);
  },
  asyncHandler(async (_req, res) => {
    clearParticipantSession(res);
    res.json({ ok: true });
  }),
);
