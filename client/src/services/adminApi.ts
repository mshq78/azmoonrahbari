import { ADMIN_ROUTES } from '@shared/contracts/routes';
import type { CharacterCode } from '@shared/contracts/constants';
import type {
  AdminAttemptDetail,
  AdminAttemptRow,
  AdminCharacter,
  AdminLoginResponse,
  AdminMeResponse,
  AdminMediaAsset,
  AdminQuestion,
  AdminVersionRow,
  DashboardResponse,
  Paginated,
} from '@shared/types/admin-api';
import { request } from './http';

/** Admin API surface. Every mutation carries the admin CSRF token. */

const admin = <T>(
  path: string,
  options: Parameters<typeof request>[1] = {},
): Promise<T> => request<T>(path, { ...options, csrfScope: 'admin' });

export const adminApi = {
  login: (username: string, password: string) =>
    admin<AdminLoginResponse>(ADMIN_ROUTES.login, {
      method: 'POST',
      body: { username, password },
    }),

  logout: () => admin<{ ok: boolean }>(ADMIN_ROUTES.logout, { method: 'POST' }),

  me: (signal?: AbortSignal) => admin<AdminMeResponse>(ADMIN_ROUTES.me, { signal }),

  dashboard: (signal?: AbortSignal) =>
    admin<DashboardResponse>(ADMIN_ROUTES.dashboard, { signal }),

  characters: (signal?: AbortSignal) =>
    admin<{ items: AdminCharacter[] }>(ADMIN_ROUTES.characters, { signal }),

  versions: (signal?: AbortSignal) =>
    admin<{ items: AdminVersionRow[] }>(ADMIN_ROUTES.versions, { signal }),

  cloneActiveVersion: () =>
    admin<{ id: number; versionNumber: number }>(ADMIN_ROUTES.cloneActiveVersion, {
      method: 'POST',
    }),

  publishVersion: (id: number) =>
    admin<{ id: number; versionNumber: number; status: string }>(
      ADMIN_ROUTES.publishVersion(id),
      { method: 'POST' },
    ),

  versionQuestions: (id: number, signal?: AbortSignal) =>
    admin<{ items: AdminQuestion[] }>(ADMIN_ROUTES.versionQuestions(id), { signal }),

  createQuestion: (
    versionId: number,
    input: { code: string; text: string; isTieBreaker: boolean },
  ) =>
    admin<AdminQuestion>(ADMIN_ROUTES.versionQuestions(versionId), {
      method: 'POST',
      body: input,
    }),

  updateQuestion: (
    id: number,
    input: { text?: string; displayOrder?: number; isActive?: boolean },
  ) => admin<AdminQuestion>(ADMIN_ROUTES.question(id), { method: 'PATCH', body: input }),

  reorderQuestions: (versionId: number, orderedQuestionIds: number[]) =>
    admin<{ items: AdminQuestion[] }>(ADMIN_ROUTES.reorderQuestions(versionId), {
      method: 'POST',
      body: { orderedQuestionIds },
    }),

  setQuestionImage: (id: number, mediaAssetId: number | null) =>
    mediaAssetId === null
      ? admin<AdminQuestion>(ADMIN_ROUTES.questionImage(id), { method: 'DELETE' })
      : admin<AdminQuestion>(ADMIN_ROUTES.questionImage(id), {
          method: 'PUT',
          body: { mediaAssetId },
        }),

  createOption: (
    questionId: number,
    input: { code: string; text: string; internalValue: CharacterCode; score: number },
  ) =>
    admin<AdminQuestion>(ADMIN_ROUTES.questionOptions(questionId), {
      method: 'POST',
      body: input,
    }),

  updateOption: (
    id: number,
    input: {
      text?: string;
      displayOrder?: number;
      internalValue?: CharacterCode;
      score?: number;
      isActive?: boolean;
    },
  ) => admin<AdminQuestion>(ADMIN_ROUTES.option(id), { method: 'PATCH', body: input }),

  setOptionImage: (id: number, mediaAssetId: number | null) =>
    mediaAssetId === null
      ? admin<AdminQuestion>(ADMIN_ROUTES.optionImage(id), { method: 'DELETE' })
      : admin<AdminQuestion>(ADMIN_ROUTES.optionImage(id), {
          method: 'PUT',
          body: { mediaAssetId },
        }),

  participants: (
    params: {
      page?: number;
      pageSize?: number;
      q?: string;
      status?: string;
      versionId?: number;
      orgCode?: string;
    },
    signal?: AbortSignal,
  ) =>
    admin<Paginated<AdminAttemptRow>>(`${ADMIN_ROUTES.participants}?${toQuery(params)}`, {
      signal,
    }),

  attempt: (id: number, signal?: AbortSignal) =>
    admin<AdminAttemptDetail>(ADMIN_ROUTES.attempt(id), { signal }),

  reopenAttempt: (id: number) =>
    admin<AdminAttemptRow>(ADMIN_ROUTES.reopenAttempt(id), { method: 'POST' }),

  deleteParticipant: (id: number) =>
    admin<{ deleted: boolean }>(ADMIN_ROUTES.participant(id), { method: 'DELETE' }),

  media: (params: { page?: number; pageSize?: number }, signal?: AbortSignal) =>
    admin<Paginated<AdminMediaAsset>>(`${ADMIN_ROUTES.media}?${toQuery(params)}`, { signal }),

  uploadMedia: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return admin<AdminMediaAsset>(ADMIN_ROUTES.media, { method: 'POST', body: form });
  },

  deleteMedia: (id: number) =>
    admin<{ deleted: boolean }>(ADMIN_ROUTES.mediaItem(id), { method: 'DELETE' }),

  exportUrl: (params: { status?: string; versionId?: number; orgCode?: string }) => {
    const query = toQuery(params);
    return query ? `${ADMIN_ROUTES.exportAttemptsCsv}?${query}` : ADMIN_ROUTES.exportAttemptsCsv;
  },
};

function toQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    search.set(key, String(value));
  }
  return search.toString();
}
