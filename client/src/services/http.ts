import { CSRF_HEADER, COOKIE_NAMES } from '@shared/contracts/constants';
import type { ApiErrorBody } from '@shared/types/public-api';

/**
 * The one place a request leaves the app.
 *
 * Cookies carry the session, so every call sends credentials and every mutation
 * sends the CSRF token the server issued. Requests are same-origin: in
 * production the API and the SPA are served by the same process, and in dev
 * Vite proxies /api to it.
 */

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  /** Present on 422 INCOMPLETE_ANSWERS. */
  readonly missingQuestionIds?: number[];

  constructor(status: number, code: string, message: string, missingQuestionIds?: number[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    if (missingQuestionIds) this.missingQuestionIds = missingQuestionIds;
  }

  get isUnauthenticated(): boolean {
    return this.status === 401;
  }

  /** A request that failed before reaching the server (offline, DNS, abort). */
  get isNetworkError(): boolean {
    return this.status === 0;
  }
}

function readCookie(name: string): string | undefined {
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(`${name}=`)) {
      return decodeURIComponent(trimmed.slice(name.length + 1));
    }
  }
  return undefined;
}

export type CsrfScope = 'participant' | 'admin';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  csrfScope?: CsrfScope;
  signal?: AbortSignal;
  /** Returns the raw Response instead of parsed JSON (used by the CSV download). */
  raw?: boolean;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET';
  const headers: Record<string, string> = { Accept: 'application/json', ...options.headers };

  const isMutation = method !== 'GET';
  if (isMutation) {
    const cookieName =
      options.csrfScope === 'admin' ? COOKIE_NAMES.adminCsrf : COOKIE_NAMES.participantCsrf;
    const token = readCookie(cookieName);
    if (token) headers[CSRF_HEADER] = token;
  }

  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    // Let the browser set the multipart boundary.
    body = options.body;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers,
      body,
      credentials: 'include',
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'NETWORK_ERROR', 'ارتباط با سرور برقرار نشد.');
  }

  if (options.raw) {
    if (!response.ok) throw await toApiError(response);
    return response as unknown as T;
  }

  if (response.status === 204) return undefined as T;

  if (!response.ok) throw await toApiError(response);

  const text = await response.text();
  if (text.length === 0) return undefined as T;
  return JSON.parse(text) as T;
}

async function toApiError(response: Response): Promise<ApiError> {
  let payload: ApiErrorBody | null = null;
  try {
    payload = (await response.json()) as ApiErrorBody;
  } catch {
    payload = null;
  }

  return new ApiError(
    response.status,
    payload?.error?.code ?? 'INTERNAL_ERROR',
    payload?.error?.message ?? 'خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کن.',
    payload?.error?.missingQuestionIds,
  );
}
