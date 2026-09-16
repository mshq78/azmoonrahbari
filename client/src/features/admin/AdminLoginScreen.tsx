import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { adminContent } from '../../content/admin.fa';
import { Button } from '../../components/Button';
import { ThemeToggle } from '../../components/ThemeToggle';
import { adminApi } from '@/services/adminApi';

export const AdminLoginScreen: React.FC<{ onSignedIn: () => void }> = ({ onSignedIn }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const login = useMutation({
    mutationFn: () => adminApi.login(username.trim(), password),
    onSuccess: () => onSignedIn(),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      setLocalError(adminContent.login.required);
      return;
    }
    setLocalError(null);
    login.mutate();
  };

  const inputClass =
    'w-full min-h-[48px] px-4 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-app)] text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)]';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-[var(--bg-app)]">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            {adminContent.login.title}
          </h1>
          <ThemeToggle compact />
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4 p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-app)]"
        >
          <div>
            <label
              htmlFor="admin-username"
              className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5"
            >
              {adminContent.login.username}
            </label>
            <input
              id="admin-username"
              type="text"
              dir="ltr"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`${inputClass} text-left`}
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5"
            >
              {adminContent.login.password}
            </label>
            <input
              id="admin-password"
              type="password"
              dir="ltr"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} text-left`}
            />
          </div>

          {(localError ?? login.isError) && (
            <p
              role="alert"
              className="text-sm text-red-600 dark:text-red-400 font-medium bg-red-500/10 rounded-lg px-3.5 py-2.5"
            >
              {localError ?? login.error?.message}
            </p>
          )}

          <Button type="submit" variant="primary" fullWidth isLoading={login.isPending}>
            {adminContent.login.submit}
          </Button>
        </form>
      </div>
    </div>
  );
};
