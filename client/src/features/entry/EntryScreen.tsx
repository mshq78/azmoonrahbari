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
  firstName?: string;
  lastName?: string;
  mobile?: string;
}

const inputClass = (hasError: boolean) =>
  `w-full min-h-[48px] px-4 py-2.5 rounded-lg border bg-[var(--surface-app)] text-[var(--text-primary)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)] ${
    hasError ? 'border-red-600 dark:border-red-400' : 'border-[var(--border-strong)]'
  }`;

export const EntryScreen: React.FC = () => {
  const navigate = useNavigate();
  const config = useConfig();
  const startOrResume = useStartOrResume();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [orgCode, setOrgCode] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  if (config.data && !config.data.registrationOpen) return <UnavailableState />;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const nextErrors: FieldErrors = {};
    if (!firstName.trim()) nextErrors.firstName = uiContent.entry.validations.firstNameRequired;
    if (!lastName.trim()) nextErrors.lastName = uiContent.entry.validations.lastNameRequired;
    if (!looksLikeIranianMobile(mobile)) nextErrors.mobile = uiContent.entry.validations.mobileInvalid;

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      const bootstrap = await startOrResume.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        mobile: mobile.trim(),
        ...(orgCode.trim() ? { orgCode: orgCode.trim() } : {}),
      });
      navigate(resolveDestination(bootstrap), { replace: true });
    } catch {
      // The error is rendered from the mutation state below.
    }
  };

  return (
    <PageShell centered footer={uiContent.footer.entry}>
      <div className="text-right">
        <div className="w-12 h-[2px] bg-[var(--accent-gold)] mb-4" aria-hidden="true" />

        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">
          {uiContent.entry.title}
        </h1>

        <form onSubmit={handleSubmit} noValidate className="space-y-5 pt-4">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5"
            >
              {uiContent.entry.firstNameLabel}{' '}
              <span className="text-[var(--accent-gold)]">*</span>
            </label>
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: undefined }));
              }}
              aria-invalid={Boolean(errors.firstName)}
              aria-describedby={errors.firstName ? 'firstName-error' : undefined}
              className={inputClass(Boolean(errors.firstName))}
            />
            {errors.firstName && (
              <p
                id="firstName-error"
                role="alert"
                className="mt-1.5 text-sm text-red-600 dark:text-red-400 font-medium"
              >
                {errors.firstName}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5"
            >
              {uiContent.entry.lastNameLabel} <span className="text-[var(--accent-gold)]">*</span>
            </label>
            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: undefined }));
              }}
              aria-invalid={Boolean(errors.lastName)}
              aria-describedby={errors.lastName ? 'lastName-error' : undefined}
              className={inputClass(Boolean(errors.lastName))}
            />
            {errors.lastName && (
              <p
                id="lastName-error"
                role="alert"
                className="mt-1.5 text-sm text-red-600 dark:text-red-400 font-medium"
              >
                {errors.lastName}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="mobile"
              className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5"
            >
              {uiContent.entry.mobileLabel} <span className="text-[var(--accent-gold)]">*</span>
            </label>
            <input
              id="mobile"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder={uiContent.entry.mobilePlaceholder}
              value={mobile}
              onChange={(e) => {
                setMobile(e.target.value);
                if (errors.mobile) setErrors((prev) => ({ ...prev, mobile: undefined }));
              }}
              aria-invalid={Boolean(errors.mobile)}
              aria-describedby={errors.mobile ? 'mobile-error' : undefined}
              className={`${inputClass(Boolean(errors.mobile))} text-right`}
            />
            {errors.mobile && (
              <p
                id="mobile-error"
                role="alert"
                className="mt-1.5 text-sm text-red-600 dark:text-red-400 font-medium"
              >
                {errors.mobile}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="orgCode"
              className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5"
            >
              {uiContent.entry.orgCodeLabel}
            </label>
            <input
              id="orgCode"
              type="text"
              value={orgCode}
              onChange={(e) => setOrgCode(e.target.value)}
              className="w-full min-h-[48px] px-4 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-app)] text-[var(--text-primary)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)]"
            />
          </div>

          {startOrResume.isError && (
            <p
              role="alert"
              className="text-sm text-red-600 dark:text-red-400 font-medium bg-red-500/10 rounded-lg px-3.5 py-2.5"
            >
              {startOrResume.error.message}
            </p>
          )}

          <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed pt-2">
            {uiContent.entry.privacyNotice}
          </p>

          <div className="pt-4">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={startOrResume.isPending}
              className="text-lg py-3.5"
            >
              {uiContent.entry.submitButton}
            </Button>
          </div>
        </form>
      </div>
    </PageShell>
  );
};
