import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uiContent } from '../../content/ui.fa';
import { Button } from '../../components/Button';
import { PageShell } from '../../components/PageShell';
import { UnavailableState } from '../states/StateViews';
import { useConfig, useStartOrResume } from '@/state/useAttempt';
import { resolveDestination } from '../attempt/AttemptContext';

/**
 * Client-side mirror of the server's mobile rule, used only to give immediate
 * feedback. The server normalizes and validates again, and its answer is the
 * one that counts.
 */
function looksLikeIranianMobile(value: string): boolean {
  const ascii = value
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\s\-().]/g, '');
  return /^(?:\+98|0098|98|0)?9\d{9}$/.test(ascii);
}

interface FieldErrors {
  fullName?: string;
  mobile?: string;
}

interface FieldProps {
  id: 'fullName' | 'mobile';
  label: string;
  error?: string;
  children: (describedBy: string | undefined, invalid: boolean) => React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ id, label, error, children }) => (
  <div>
    <label
      htmlFor={id}
      className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-2"
    >
      {label}
    </label>
    {children(error ? `${id}-error` : undefined, Boolean(error))}
    {error && (
      <p id={`${id}-error`} role="alert" className="mt-2 text-[13px] text-red-600 dark:text-red-400">
        {error}
      </p>
    )}
  </div>
);

const inputClass = (invalid: boolean) =>
  `w-full min-h-[52px] px-4 rounded-[var(--radius-md)] border bg-[var(--surface-app)] text-[var(--text-primary)] text-[17px]
   placeholder:text-[var(--text-muted)] placeholder:text-[15px]
   transition-[border-color,box-shadow] duration-200
   focus:outline-none focus:border-[var(--accent-gold)] focus:shadow-[0_0_0_3px_var(--selected-tint)]
   ${invalid ? 'border-red-500' : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'}`;

export const EntryScreen: React.FC = () => {
  const navigate = useNavigate();
  const config = useConfig();
  const startOrResume = useStartOrResume();

  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  if (config.data && !config.data.registrationOpen) return <UnavailableState />;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const nextErrors: FieldErrors = {};
    if (fullName.trim().length < 2) nextErrors.fullName = uiContent.entry.validations.fullNameRequired;
    if (!looksLikeIranianMobile(mobile)) nextErrors.mobile = uiContent.entry.validations.mobileInvalid;

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      const bootstrap = await startOrResume.mutateAsync({
        fullName: fullName.trim(),
        mobile: mobile.trim(),
      });
      navigate(resolveDestination(bootstrap), { replace: true });
    } catch {
      // The error is rendered from the mutation state below.
    }
  };

  return (
    <PageShell centered footer={uiContent.footer.entry}>
      <div className="text-right fade-rise">
        <span className="block w-9 h-[3px] rounded-full bg-[var(--accent-gold)] mb-5" aria-hidden="true" />

        <h1 className="text-[26px] sm:text-[30px] font-bold text-[var(--text-primary)] leading-[1.45] tracking-tight text-balance">
          {uiContent.entry.title}
        </h1>

        <form onSubmit={handleSubmit} noValidate className="space-y-5 pt-8">
          <Field id="fullName" label={uiContent.entry.fullNameLabel} error={errors.fullName}>
            {(describedBy, invalid) => (
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                enterKeyHint="next"
                placeholder={uiContent.entry.fullNamePlaceholder}
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                }}
                aria-invalid={invalid}
                aria-describedby={describedBy}
                className={inputClass(invalid)}
              />
            )}
          </Field>

          <Field id="mobile" label={uiContent.entry.mobileLabel} error={errors.mobile}>
            {(describedBy, invalid) => (
              <input
                id="mobile"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                enterKeyHint="go"
                dir="ltr"
                placeholder={uiContent.entry.mobilePlaceholder}
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value);
                  if (errors.mobile) setErrors((prev) => ({ ...prev, mobile: undefined }));
                }}
                aria-invalid={invalid}
                aria-describedby={describedBy}
                className={`${inputClass(invalid)} text-left font-mono tracking-wide`}
              />
            )}
          </Field>

          {startOrResume.isError && (
            <p
              role="alert"
              className="text-[13px] text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-[var(--radius-md)] px-4 py-3"
            >
              {startOrResume.error.message}
            </p>
          )}

          <div className="pt-3">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={startOrResume.isPending}
              className="text-[17px] min-h-[54px] rounded-[var(--radius-md)]"
            >
              {uiContent.entry.submitButton}
            </Button>
          </div>

          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed text-center pt-1">
            {uiContent.entry.privacyNotice}
          </p>
        </form>
      </div>
    </PageShell>
  );
};
