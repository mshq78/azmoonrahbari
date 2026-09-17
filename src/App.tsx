import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QuizProvider } from './context/QuizContext';
import { IntroScreen } from './features/intro/IntroScreen';
import { EntryScreen } from './features/entry/EntryScreen';
import { QuestionScreen } from './features/questionnaire/QuestionScreen';
import { ReviewScreen } from './features/review/ReviewScreen';
import { TiebreakScreen } from './features/tiebreak/TiebreakScreen';
import { RevealScreen } from './features/reveal/RevealScreen';
import { ResultScreen } from './features/result/ResultScreen';
import { AlreadyScreen } from './features/already/AlreadyScreen';
import { OfflineBanner } from './features/states/StateViews';
import { DevToolbar } from './components/DevToolbar';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <QuizProvider>
      <BrowserRouter>
        {isOffline && <OfflineBanner />}
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<IntroScreen />} />
            <Route path="/start" element={<EntryScreen />} />
            <Route path="/q/:index" element={<QuestionScreen />} />
            <Route path="/review" element={<ReviewScreen />} />
            <Route path="/tiebreak" element={<TiebreakScreen />} />
            <Route path="/reveal" element={<RevealScreen />} />
            <Route path="/result" element={<ResultScreen />} />
            <Route path="/already" element={<AlreadyScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>

        {/* Development & testing preview toolbar */}
        <DevToolbar />
      </BrowserRouter>
    </QuizProvider>
  );
}
