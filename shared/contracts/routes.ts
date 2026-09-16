/** Single source of truth for API paths, shared by the server router and the client fetch layer. */
export const API_BASE = '/api';

export const PUBLIC_ROUTES = {
  config: `${API_BASE}/public/config`,
  startOrResume: `${API_BASE}/public/attempts/start-or-resume`,
  bootstrap: `${API_BASE}/public/attempts/current/bootstrap`,
  answer: (questionId: number | string) =>
    `${API_BASE}/public/attempts/current/answers/${questionId}`,
  finalize: `${API_BASE}/public/attempts/current/finalize`,
  result: `${API_BASE}/public/attempts/current/result`,
  logout: `${API_BASE}/public/session/logout`,
} as const;

export const ADMIN_ROUTES = {
  login: `${API_BASE}/admin/login`,
  logout: `${API_BASE}/admin/logout`,
  me: `${API_BASE}/admin/me`,
  dashboard: `${API_BASE}/admin/dashboard`,
  characters: `${API_BASE}/admin/characters`,
  versions: `${API_BASE}/admin/versions`,
  cloneActiveVersion: `${API_BASE}/admin/versions/clone-active`,
  publishVersion: (id: number | string) => `${API_BASE}/admin/versions/${id}/publish`,
  versionQuestions: (id: number | string) => `${API_BASE}/admin/versions/${id}/questions`,
  reorderQuestions: (id: number | string) => `${API_BASE}/admin/versions/${id}/questions/reorder`,
  question: (id: number | string) => `${API_BASE}/admin/questions/${id}`,
  questionPreview: (id: number | string) => `${API_BASE}/admin/questions/${id}/preview`,
  questionImage: (id: number | string) => `${API_BASE}/admin/questions/${id}/image`,
  questionOptions: (id: number | string) => `${API_BASE}/admin/questions/${id}/options`,
  option: (id: number | string) => `${API_BASE}/admin/options/${id}`,
  optionImage: (id: number | string) => `${API_BASE}/admin/options/${id}/image`,
  participants: `${API_BASE}/admin/participants`,
  participant: (id: number | string) => `${API_BASE}/admin/participants/${id}`,
  attempt: (id: number | string) => `${API_BASE}/admin/attempts/${id}`,
  reopenAttempt: (id: number | string) => `${API_BASE}/admin/attempts/${id}/reopen`,
  exportAttemptsCsv: `${API_BASE}/admin/exports/attempts.csv`,
  media: `${API_BASE}/admin/media`,
  mediaItem: (id: number | string) => `${API_BASE}/admin/media/${id}`,
} as const;
