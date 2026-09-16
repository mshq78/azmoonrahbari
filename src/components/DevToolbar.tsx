import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Settings, X } from 'lucide-react';
import { uiContent } from '../content/ui.fa';

export const DevToolbar: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const currentState = searchParams.get('state') || 'normal';

  const setDevState = (state: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (state === 'normal') {
      nextParams.delete('state');
    } else {
      nextParams.set('state', state);
    }
    setSearchParams(nextParams);

    if (state === 'tiebreak') {
      navigate(`/tiebreak?${nextParams.toString()}`);
    } else if (state === 'already') {
      navigate(`/already?${nextParams.toString()}`);
    }
  };

  return (
    <aside
      aria-label="ابزار توسعه و بررسی حالت‌ها"
      className="fixed bottom-3 left-3 z-40"
    >
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-10 h-10 rounded-full bg-[var(--surface-app)] border border-[var(--border-strong)] text-[var(--text-secondary)] shadow-md flex items-center justify-center hover:text-[var(--accent-gold)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)] opacity-60 hover:opacity-100"
          title={uiContent.devToolbar.title}
          aria-label={uiContent.devToolbar.title}
        >
          <Settings className="w-4 h-4" />
        </button>
      ) : (
        <div className="bg-[var(--surface-app)] border-2 border-[var(--border-strong)] rounded-xl p-3 shadow-xl w-64 text-right text-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border-subtle)]">
            <span className="font-bold text-[var(--text-primary)]">حالت‌های تست (Dev)</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              aria-label={uiContent.devToolbar.close}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            {[
              { id: 'normal', label: 'حالت عادی' },
              { id: 'tiebreak', label: 'تایبریک (?state=tiebreak)' },
              { id: 'already', label: 'قبلاً شرکت کرده (?state=already)' },
              { id: 'offline', label: 'آفلاین (?state=offline)' },
              { id: 'error', label: 'خطا (?state=error)' },
              { id: 'unavailable', label: 'غیرفعال (?state=unavailable)' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setDevState(item.id)}
                className={`w-full text-right px-2.5 py-1.5 rounded transition-colors ${
                  currentState === item.id
                    ? 'bg-[var(--accent-gold)] text-[var(--navy-900)] font-bold'
                    : 'hover:bg-[var(--surface-muted)] text-[var(--text-secondary)]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
