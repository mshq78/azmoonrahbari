import { mockQuestions, mockTiebreakQuestion, Question, TiebreakQuestion } from '../content/mockData';
import { CharacterCode } from '../content/characters.fa';

export interface ParticipantInput {
  firstName: string;
  lastName: string;
  mobile: string;
  orgCode?: string;
}

export interface BootstrapResponse {
  status: 'ready' | 'already_participated' | 'unavailable' | 'error';
  questions: Question[];
  tiebreakQuestion: TiebreakQuestion;
  existingAnswers: Record<number, string>;
  trackingCode?: string;
  alreadyResult?: {
    characterCode: CharacterCode;
    trackingCode: string;
  };
}

export interface SaveAnswerResponse {
  success: boolean;
  syncedAt: string;
}

export interface FinalizeResponse {
  outcome: 'completed' | 'tiebreak_required';
  trackingCode: string;
  result?: {
    characterCode: CharacterCode;
  };
}

export interface ResultResponse {
  success: boolean;
  trackingCode: string;
  characterCode: CharacterCode;
}

// In-memory mock session store (frontend-only, no localStorage for answers)
let currentParticipant: ParticipantInput | null = null;
const sessionAnswers: Record<number, string> = {};

/**
 * Start or resume a session with participant info.
 */
export async function startOrResume(data: ParticipantInput): Promise<BootstrapResponse> {
  // TODO: wire to real API
  await new Promise((resolve) => setTimeout(resolve, 120));
  currentParticipant = { ...data };

  return {
    status: 'ready',
    questions: mockQuestions,
    tiebreakQuestion: mockTiebreakQuestion,
    existingAnswers: { ...sessionAnswers },
  };
}

/**
 * Fetch application bootstrap data (questions, active status).
 */
export async function getBootstrap(): Promise<BootstrapResponse> {
  // TODO: wire to real API
  await new Promise((resolve) => setTimeout(resolve, 80));

  return {
    status: 'ready',
    questions: mockQuestions,
    tiebreakQuestion: mockTiebreakQuestion,
    existingAnswers: { ...sessionAnswers },
  };
}

/**
 * Save an answer for a specific question.
 */
export async function saveAnswer(questionId: number, optionId: string): Promise<SaveAnswerResponse> {
  // TODO: wire to real API
  await new Promise((resolve) => setTimeout(resolve, 100));
  sessionAnswers[questionId] = optionId;

  return {
    success: true,
    syncedAt: new Date().toISOString(),
  };
}

/**
 * Finalize answers and retrieve outcome.
 * In mock mode returns LINCOLN as per prompt specification.
 */
export async function finalize(): Promise<FinalizeResponse> {
  // TODO: wire to real API
  await new Promise((resolve) => setTimeout(resolve, 250));

  return {
    outcome: 'completed',
    trackingCode: '۲۴۹۱-BF7K',
    result: {
      characterCode: 'LINCOLN',
    },
  };
}

/**
 * Submit tiebreak answer if requested by backend.
 */
export async function finalizeTiebreak(optionId: string): Promise<FinalizeResponse> {
  // TODO: wire to real API
  await new Promise((resolve) => setTimeout(resolve, 200));

  return {
    outcome: 'completed',
    trackingCode: '۲۴۹۱-BF7K',
    result: {
      characterCode: 'LINCOLN',
    },
  };
}

/**
 * Fetch existing result by tracking code or session.
 */
export async function getResult(trackingCode?: string): Promise<ResultResponse> {
  // TODO: wire to real API
  await new Promise((resolve) => setTimeout(resolve, 150));

  return {
    success: true,
    trackingCode: trackingCode || '۲۴۹۱-BF7K',
    characterCode: 'LINCOLN',
  };
}
