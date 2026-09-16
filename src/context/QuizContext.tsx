import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockQuestions, Question, TiebreakQuestion, mockTiebreakQuestion } from '../content/mockData';
import { saveAnswer as apiSaveAnswer, finalize as apiFinalize, finalizeTiebreak as apiFinalizeTiebreak } from '../services/api';
import { CharacterCode } from '../content/characters.fa';

interface QuizContextType {
  questions: Question[];
  tiebreakQuestion: TiebreakQuestion;
  answers: Record<number, string>;
  tiebreakAnswer: string | null;
  selectAnswer: (questionId: number, optionId: string) => Promise<void>;
  selectTiebreakAnswer: (optionId: string) => void;
  syncState: 'idle' | 'saving' | 'saved';
  allAnswered: boolean;
  answeredCount: number;
  finalizeQuiz: () => Promise<{ outcome: 'completed' | 'tiebreak_required'; trackingCode: string; characterCode?: CharacterCode }>;
  trackingCode: string;
  resultCharacter: CharacterCode;
  returnToReview: boolean;
  setReturnToReview: (val: boolean) => void;
  resetAnswers: () => void;
}

const QuizContext = createContext<QuizContextType | null>(null);

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [questions] = useState<Question[]>(mockQuestions);
  const [tiebreakQuestion] = useState<TiebreakQuestion>(mockTiebreakQuestion);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [tiebreakAnswer, setTiebreakAnswer] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [trackingCode, setTrackingCode] = useState<string>('۲۴۹۱-BF7K');
  const [resultCharacter, setResultCharacter] = useState<CharacterCode>('LINCOLN');
  const [returnToReview, setReturnToReview] = useState<boolean>(false);

  const selectAnswer = async (questionId: number, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    setSyncState('saving');
    try {
      await apiSaveAnswer(questionId, optionId);
      setSyncState('saved');
      setTimeout(() => {
        setSyncState('idle');
      }, 1800);
    } catch {
      setSyncState('idle');
    }
  };

  const selectTiebreakAnswer = (optionId: string) => {
    setTiebreakAnswer(optionId);
  };

  const finalizeQuiz = async () => {
    const res = await apiFinalize();
    setTrackingCode(res.trackingCode);
    if (res.result?.characterCode) {
      setResultCharacter(res.result.characterCode);
    }
    return {
      outcome: res.outcome,
      trackingCode: res.trackingCode,
      characterCode: res.result?.characterCode,
    };
  };

  const resetAnswers = () => {
    setAnswers({});
    setTiebreakAnswer(null);
  };

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  return (
    <QuizContext.Provider
      value={{
        questions,
        tiebreakQuestion,
        answers,
        tiebreakAnswer,
        selectAnswer,
        selectTiebreakAnswer,
        syncState,
        allAnswered,
        answeredCount,
        finalizeQuiz,
        trackingCode,
        resultCharacter,
        returnToReview,
        setReturnToReview,
        resetAnswers,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const ctx = useContext(QuizContext);
  if (!ctx) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return ctx;
};
