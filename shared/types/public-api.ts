import type { AttemptStatus, CharacterCode } from '../contracts/constants';

/** Public option shape. `score`, `internalValue` and `scoringMetadata` are stripped by the serializer. */
export interface PublicOption {
  id: number;
  code: string;
  text: string;
  displayOrder: number;
  imageUrl: string | null;
}

export interface PublicQuestion {
  id: number;
  code: string;
  text: string;
  displayOrder: number;
  imageUrl: string | null;
  options: PublicOption[];
}

export interface PublicTieBreak {
  questionId: number;
  code: string;
  text: string;
  options: Array<Pick<PublicOption, 'id' | 'code' | 'text'>>;
}

export interface ConfirmedAnswer {
  questionId: number;
  selectedOptionId: number;
  updatedAt: string;
}

export interface AttemptSummary {
  publicId: string;
  status: AttemptStatus;
  testVersionId: number;
  versionNumber: number;
  completionCycle: number;
  reopenCount: number;
  startedAt: string | null;
  lastActivityAt: string;
  completedAt: string | null;
  trackingCode: string | null;
}

export interface ParticipantSummary {
  firstName: string;
  lastName: string;
  mobile: string;
  orgCode: string | null;
}

export interface AttemptResult {
  characterCode: CharacterCode;
}

export interface BootstrapResponse {
  attempt: AttemptSummary;
  participant: ParticipantSummary;
  content: {
    versionNumber: number;
    /** Changes whenever any active question/option of this version changes; the client refetches on mismatch. */
    contentHash: string;
    questions: PublicQuestion[];
  };
  answers: ConfirmedAnswer[];
  progress: { answered: number; total: number };
  tieBreak: PublicTieBreak | null;
  result: AttemptResult | null;
  csrfToken: string;
}

export interface PublicConfigResponse {
  registrationOpen: boolean;
  versionNumber: number | null;
}

export interface StartOrResumeRequest {
  firstName: string;
  lastName: string;
  mobile: string;
  orgCode?: string;
}

export interface SaveAnswerRequest {
  selectedOptionId: number;
  clientMutationId: string;
}

export interface SaveAnswerResponse {
  questionId: number;
  selectedOptionId: number;
  clientMutationId: string;
  savedAt: string;
  attemptStatus: AttemptStatus;
  progress: { answered: number; total: number };
}

export interface FinalizeRequest {
  answers: Array<{ questionId: number; selectedOptionId: number }>;
}

export interface FinalizeCompletedResponse {
  outcome: 'completed';
  trackingCode: string;
  completedAt: string;
  result: AttemptResult;
}

export interface FinalizeTieBreakResponse {
  outcome: 'tie_break_required';
  tieBreak: PublicTieBreak;
}

export type FinalizeResponse = FinalizeCompletedResponse | FinalizeTieBreakResponse;

export interface ResultResponse {
  status: AttemptStatus;
  trackingCode: string;
  completedAt: string;
  result: AttemptResult;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    /** Only present on 422 INCOMPLETE_ANSWERS. */
    missingQuestionIds?: number[];
  };
}
