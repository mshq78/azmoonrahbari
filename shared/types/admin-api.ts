import type {
  AttemptStatus,
  CharacterCode,
  TestVersionStatus,
} from '../contracts/constants';

export interface AdminSummary {
  id: number;
  username: string;
  displayName: string;
  lastLoginAt: string | null;
}

export interface AdminLoginResponse {
  admin: AdminSummary;
  csrfToken: string;
}

export interface AdminMeResponse {
  admin: AdminSummary;
  csrfToken: string;
}

export interface DashboardResponse {
  totals: {
    participants: number;
    attempts: number;
    activeQuestions: number;
  };
  attemptsByStatus: Record<AttemptStatus, number>;
  publishedVersion: { id: number; versionNumber: number; publishedAt: string | null } | null;
  activeVersionEditable: boolean;
  characterDistribution: Array<{ code: CharacterCode; displayName: string; count: number }>;
  latestAttempts: AdminAttemptRow[];
}

export interface AdminAttemptRow {
  id: number;
  publicId: string;
  participantId: number;
  firstName: string;
  lastName: string;
  mobile: string;
  orgCode: string | null;
  status: AttemptStatus;
  versionNumber: number;
  trackingCode: string | null;
  resultCharacterCode: CharacterCode | null;
  createdAt: string;
  lastActivityAt: string;
  completedAt: string | null;
  reopenCount: number;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AdminVersionRow {
  id: number;
  versionNumber: number;
  status: TestVersionStatus;
  title: string | null;
  notes: string | null;
  publishedAt: string | null;
  createdAt: string;
  attemptCount: number;
  activeQuestionCount: number;
  isActive: boolean;
  editable: boolean;
}

export interface AdminOption {
  id: number;
  questionId: number;
  code: string;
  text: string;
  displayOrder: number;
  internalValue: CharacterCode;
  score: string;
  imageAssetId: number | null;
  imageUrl: string | null;
  isActive: boolean;
}

export interface AdminQuestion {
  id: number;
  testVersionId: number;
  code: string;
  text: string;
  displayOrder: number;
  isTieBreaker: boolean;
  imageAssetId: number | null;
  imageUrl: string | null;
  isActive: boolean;
  options: AdminOption[];
}

export interface AdminAttemptDetail {
  attempt: AdminAttemptRow;
  resultScores: Record<string, number> | null;
  resultComputedAt: string | null;
  tieBreakRequired: boolean;
  tiedCharacters: CharacterCode[] | null;
  completionCycle: number;
  answers: Array<{
    questionId: number;
    questionCode: string;
    questionText: string;
    displayOrder: number;
    isTieBreaker: boolean;
    selectedOptionId: number;
    optionCode: string;
    optionText: string;
    internalValue: CharacterCode;
    score: string;
  }>;
}

export interface AdminMediaAsset {
  id: number;
  originalName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  isActive: boolean;
  referenceCount: number;
  createdAt: string;
}

export interface AdminCharacter {
  code: CharacterCode;
  displayName: string;
  years: string;
  tieOrder: number;
  isActive: boolean;
}
