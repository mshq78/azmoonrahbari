import { IDEMPOTENCY_HEADER } from '@shared/contracts/constants';
import { PUBLIC_ROUTES } from '@shared/contracts/routes';
import type {
  BootstrapResponse,
  FinalizeResponse,
  PublicConfigResponse,
  ResultResponse,
  SaveAnswerResponse,
  StartOrResumeRequest,
} from '@shared/types/public-api';
import { request } from './http';

/** Public API surface. Every call is cookie-authenticated and same-origin. */

export function fetchConfig(signal?: AbortSignal): Promise<PublicConfigResponse> {
  return request<PublicConfigResponse>(PUBLIC_ROUTES.config, { signal });
}

export function startOrResume(input: StartOrResumeRequest): Promise<BootstrapResponse> {
  return request<BootstrapResponse>(PUBLIC_ROUTES.startOrResume, {
    method: 'POST',
    body: input,
  });
}

export function fetchBootstrap(signal?: AbortSignal): Promise<BootstrapResponse> {
  return request<BootstrapResponse>(PUBLIC_ROUTES.bootstrap, { signal });
}

export function saveAnswer(input: {
  questionId: number;
  selectedOptionId: number;
  clientMutationId: string;
}): Promise<SaveAnswerResponse> {
  return request<SaveAnswerResponse>(PUBLIC_ROUTES.answer(input.questionId), {
    method: 'PUT',
    body: {
      selectedOptionId: input.selectedOptionId,
      clientMutationId: input.clientMutationId,
    },
  });
}

/**
 * The idempotency key is generated once per finalize attempt and reused across
 * retries, so a dropped response can never produce a second scoring run.
 */
export function finalize(input: {
  answers: Array<{ questionId: number; selectedOptionId: number }>;
  idempotencyKey: string;
}): Promise<FinalizeResponse> {
  return request<FinalizeResponse>(PUBLIC_ROUTES.finalize, {
    method: 'POST',
    body: { answers: input.answers },
    headers: { [IDEMPOTENCY_HEADER]: input.idempotencyKey },
  });
}

export function fetchResult(signal?: AbortSignal): Promise<ResultResponse> {
  return request<ResultResponse>(PUBLIC_ROUTES.result, { signal });
}

export function logout(): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(PUBLIC_ROUTES.logout, { method: 'POST' });
}
