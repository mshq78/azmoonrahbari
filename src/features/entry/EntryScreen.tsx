import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uiContent } from '../../content/ui.fa';
import { BrandLockup } from '../../components/BrandLockup';
import { Button } from '../../components/Button';
import { ThemeToggle } from '../../components/ThemeToggle';
import { startOrResume } from '../../services/api';

/**
 * Normalizes Persian and Arabic numerals to ASCII standard digits
 */
function normalizeDigits(str: string): string {
  const persianNumerals = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

  let result = str;
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(persianNumerals[i], 'g'), String(i));
    result = result.replace(new RegExp(arabicNumerals[i], 'g'), String(i));
  }
  return result.replace(/[\s\-_]/g, '');
}

/**
 * Validates Iranian mobile numbers (09..., +989..., 00989...)
 */
function isValidIranianMobile(phone: string): boolean {
  const normalized = normalizeDigits(phone);
  // Matches: 09xxxxxxxxx, +989xxxxxxxxx, 00989xxxxxxxxx, 9xxxxxxxxx
  return /^(\+98|0098|0)?9\d{9}$/.test(normalized);
}

export const EntryScreen: React.FC = () => {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [orgCode, setOrgCode] = useState('');

  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    mobile?: string;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: typeof errors = {};
    if (!firstName.trim()) {
      newErrors.firstName = uiContent.entry.validations.firstNameRequired;
    }
    if (!lastName.trim()) {
      newErrors.lastName = uiContent.entry.validations.lastNameRequired;
    }
    if (!mobile.trim() || !isValidIranianMobile(mobile)) {
      newErrors.mobile = uiContent.entry.validations.mobileInvalid;
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await startOrResume({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        mobile: normalizeDigits(mobile),
        orgCode: orgCode.trim() || undefined,
      });
      navigate('/q/1');
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between py-6 px-4 sm:px-6 max-w-xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between pb-6 border-b border-[var(--border-subtle)]/60">
        <BrandLockup compact />
        <ThemeToggle compact />
      </header>

      {/* Entry Form */}
      <main className="my-auto py-6 sm:py-8 text-right">
        <div className="w-12 h-[2px] bg-[var(--accent-gold)] mb-4" aria-hidden="true" />

        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">
          {uiContent.entry.title}
        </h1>

        <form onSubmit={handleSubmit} noValidate className="space-y-5 pt-4">
          {/* First Name */}
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5"
            >
              {uiContent.entry.firstNameLabel} <span className="text-[var(--accent-gold)]">*</span>
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
              className={`w-full min-h-[48px] px-4 py-2.5 rounded-lg border bg-[var(--surface-app)] text-[var(--text-primary)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)] ${
                errors.firstName
                  ? 'border-red-600 dark:border-red-400'
                  : 'border-[var(--border-strong)]'
              }`}
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

          {/* Last Name */}
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
              className={`w-full min-h-[48px] px-4 py-2.5 rounded-lg border bg-[var(--surface-app)] text-[var(--text-primary)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)] ${
                errors.lastName
                  ? 'border-red-600 dark:border-red-400'
                  : 'border-[var(--border-strong)]'
              }`}
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

          {/* Mobile Number */}
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
              dir="ltr"
              autoComplete="tel"
              placeholder={uiContent.entry.mobilePlaceholder}
              value={mobile}
              onChange={(e) => {
                setMobile(e.target.value);
                if (errors.mobile) setErrors((prev) => ({ ...prev, mobile: undefined }));
              }}
              aria-invalid={Boolean(errors.mobile)}
              aria-describedby={errors.mobile ? 'mobile-error' : undefined}
              className={`w-full min-h-[48px] px-4 py-2.5 rounded-lg border bg-[var(--surface-app)] text-[var(--text-primary)] text-right transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)] ${
                errors.mobile
                  ? 'border-red-600 dark:border-red-400'
                  : 'border-[var(--border-strong)]'
              }`}
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

          {/* Org / Course Code (Optional) */}
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

          {/* Privacy Note */}
          <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed pt-2">
            {uiContent.entry.privacyNotice}
          </p>

          {/* Primary Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isSubmitting}
              className="text-lg py-3.5"
            >
              {uiContent.entry.submitButton}
            </Button>
          </div>
        </form>
      </main>

      <footer className="pt-4 pb-2 text-center text-xs text-[var(--text-muted)]">
        حفظ حریم خصوصی و امانت‌داری داده‌های سازمانی
      </footer>
    </div>
  );
};
