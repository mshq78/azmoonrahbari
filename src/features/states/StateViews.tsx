import React from 'react';
import { AlertCircle, WifiOff } from 'lucide-react';
import { uiContent } from '../../content/ui.fa';
import { Button } from '../../components/Button';

export const OfflineBanner: React.FC = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-[var(--surface-muted)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)] px-4 py-2.5 text-center text-sm flex items-center justify-center gap-2"
    >
      <WifiOff className="w-4 h-4 text-[var(--accent-gold)] shrink-0" aria-hidden="true" />
      <span>{uiContent.states.offlineNotice}</span>
    </div>
  );
};

export const ErrorState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 max-w-md mx-auto">
      <div className="w-12 h-12 rounded-full bg-[var(--surface-muted)] border border-[var(--border-strong)] flex items-center justify-center mb-4 text-[var(--accent-gold)]">
        <AlertCircle className="w-6 h-6" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
        {uiContent.states.loadFailed}
      </h2>
      <p className="text-[16px] text-[var(--text-secondary)] mb-6">
        ارتباط با سرور برقرار نشد. لطفاً اتصال اینترنت خود را بررسی کرده و مجدداً تلاش کنید.
      </p>
      <Button variant="primary" onClick={onRetry}>
        {uiContent.states.retry}
      </Button>
    </div>
  );
};

export const UnavailableState: React.FC = () => {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 max-w-md mx-auto">
      <div className="w-12 h-12 rounded-full bg-[var(--surface-muted)] border border-[var(--border-strong)] flex items-center justify-center mb-4 text-[var(--accent-gold)]">
        <AlertCircle className="w-6 h-6" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
        {uiContent.states.unavailableNotice}
      </h2>
    </div>
  );
};

export const LoadingSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-label={uiContent.states.loading}
      className="max-w-xl mx-auto p-4 sm:p-6 space-y-6 animate-pulse"
    >
      <div className="h-4 bg-[var(--border-subtle)] rounded w-1/3" />
      <div className="h-10 bg-[var(--border-subtle)] rounded w-3/4" />
      <div className="space-y-3 pt-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-[var(--surface-muted)] rounded-xl border border-[var(--border-subtle)]" />
        ))}
      </div>
    </div>
  );
};
