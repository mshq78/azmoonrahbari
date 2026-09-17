import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { uiContent } from '../content/ui.fa';
import { Button } from './Button';
import { PageShell } from './PageShell';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Last line of defence for a render-time crash.
 *
 * Without it a thrown error unmounts the whole tree and leaves a blank white
 * page — indistinguishable, to a participant, from the site being down. Answers
 * are safe either way: they live in Dexie and on the server, not in React
 * state, so reloading genuinely does resume the attempt.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // The console is the only reporter this app has; there is no error service.
    console.error('Unhandled render error:', error, errorInfo);
  }

  private readonly handleReload = (): void => {
    window.location.reload();
  };

  override render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <PageShell centered>
        <div className="space-y-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-[var(--surface-muted)] border-2 border-[var(--accent-gold)] flex items-center justify-center text-[var(--accent-gold)] shadow-sm">
            <AlertTriangle className="w-8 h-8" aria-hidden="true" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] leading-tight">
            {uiContent.errorBoundary.title}
          </h1>

          <p className="text-base text-[var(--text-secondary)] leading-relaxed max-w-md mx-auto">
            {uiContent.errorBoundary.description}
          </p>

          <div className="pt-2 max-w-xs mx-auto">
            <Button variant="primary" fullWidth onClick={this.handleReload}>
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>{uiContent.errorBoundary.retryButton}</span>
            </Button>
          </div>
        </div>
      </PageShell>
    );
  }
}
