import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AlreadyScreen } from './features/already/AlreadyScreen';
import { EntryScreen } from './features/entry/EntryScreen';
import { IntroScreen } from './features/intro/IntroScreen';
import { QuestionScreen } from './features/questionnaire/QuestionScreen';
import { ResultScreen } from './features/result/ResultScreen';
import { RevealScreen } from './features/reveal/RevealScreen';
import { ReviewScreen } from './features/review/ReviewScreen';
import { TiebreakScreen } from './features/tiebreak/TiebreakScreen';
import { RequireAttempt } from './features/attempt/AttemptContext';
import { OfflineBanner } from './features/states/StateViews';
import { adminRoutes } from './features/admin/routes';
import { applyTheme, resolveInitialTheme } from './state/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Answers are the durable state and live in Dexie; queries only mirror
      // the server, so refetching on reconnect is cheap and always correct.
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 10_000,
    },
    mutations: { retry: 0 },
  },
});

function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return online;
}

export default function App() {
  const online = useOnlineStatus();

  // Apply the stored theme before the first paint of any screen.
  useEffect(() => {
    applyTheme(resolveInitialTheme());
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {!online && <OfflineBanner />}
        <Routes>
          <Route path="/" element={<IntroScreen />} />
          <Route path="/start" element={<EntryScreen />} />

          {/* Everything below needs a live participant session. */}
          <Route element={<RequireAttempt />}>
            <Route path="/q/:index" element={<QuestionScreen />} />
            <Route path="/review" element={<ReviewScreen />} />
            <Route path="/tiebreak" element={<TiebreakScreen />} />
            <Route path="/reveal" element={<RevealScreen />} />
            <Route path="/result" element={<ResultScreen />} />
            <Route path="/already" element={<AlreadyScreen />} />
          </Route>

          {adminRoutes}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
