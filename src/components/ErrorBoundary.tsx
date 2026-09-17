import React, { Component, ErrorInfo, ReactNode } from 'react';
import { PageShell } from './PageShell';
import { Button } from './Button';
import { uiContent } from '../content/ui.fa';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <PageShell>
          <main className="my-auto py-10 space-y-6 text-center">
            {/* Error Icon */}
            <div className="w-16 h-16 mx-auto rounded-full bg-[var(--surface-muted)] border-2 border-[var(--accent-gold)] flex items-center justify-center text-[var(--accent-gold)] shadow-sm">
              <AlertTriangle className="w-8 h-8" aria-hidden="true" />
            </div>

            {/* Heading */}
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] leading-tight tracking-tight">
              {uiContent.errorBoundary.title}
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-md mx-auto">
              {uiContent.errorBoundary.description}
            </p>

            {/* Retry Button */}
            <div className="pt-4 max-w-xs mx-auto">
              <Button
                variant="primary"
                fullWidth
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>{uiContent.errorBoundary.retryButton}</span>
              </Button>
            </div>
          </main>
        </PageShell>
      );
    }

    return this.props.children;
  }
}
