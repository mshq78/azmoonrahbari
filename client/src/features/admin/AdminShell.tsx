import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminContent } from '../../content/admin.fa';
import { ThemeToggle } from '../../components/ThemeToggle';
import { adminApi } from '@/services/adminApi';
import { ApiError } from '@/services/http';
import { AdminLoginScreen } from './AdminLoginScreen';

export const adminQueryKeys = {
  me: ['admin', 'me'] as const,
  dashboard: ['admin', 'dashboard'] as const,
  versions: ['admin', 'versions'] as const,
  characters: ['admin', 'characters'] as const,
  questions: (versionId: number) => ['admin', 'questions', versionId] as const,
  participants: (params: unknown) => ['admin', 'participants', params] as const,
  attempt: (id: number) => ['admin', 'attempt', id] as const,
  media: (page: number) => ['admin', 'media', page] as const,
};

const navItems = [
  { to: '/admin', label: adminContent.nav.dashboard, end: true },
  { to: '/admin/participants', label: adminContent.nav.participants, end: false },
  { to: '/admin/versions', label: adminContent.nav.versions, end: false },
  { to: '/admin/media', label: adminContent.nav.media, end: false },
];

/**
 * Admin chrome plus the session gate. A 401 renders the login screen inline
 * rather than redirecting, so a session that expires mid-task returns the admin
 * to the same page after signing back in.
 */
export const AdminShell: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const me = useQuery({
    queryKey: adminQueryKeys.me,
    queryFn: ({ signal }) => adminApi.me(signal),
    retry: (failureCount, error) =>
      !(error instanceof ApiError && error.isUnauthenticated) && failureCount < 2,
    staleTime: 60_000,
  });

  const logout = useMutation({
    mutationFn: adminApi.logout,
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ['admin'] });
      navigate('/admin', { replace: true });
    },
  });

  if (me.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)]">
        {adminContent.common.loading}
      </div>
    );
  }

  if (me.error instanceof ApiError && me.error.isUnauthenticated) {
    return <AdminLoginScreen onSignedIn={() => void me.refetch()} />;
  }

  if (me.error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-[var(--text-primary)]">{me.error.message}</p>
        <button
          type="button"
          onClick={() => void me.refetch()}
          className="min-h-[44px] px-4 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-app)] text-[var(--text-primary)]"
        >
          {adminContent.common.retry}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border-subtle)] bg-[var(--surface-app)]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[17px]">{adminContent.brand}</span>
            <span className="text-sm text-[var(--text-muted)]">{me.data?.admin.displayName}</span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <button
              type="button"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              className="min-h-[44px] px-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-app)] text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors disabled:opacity-50"
            >
              {adminContent.nav.logout}
            </button>
          </div>
        </div>

        <nav className="max-w-6xl mx-auto px-4 pb-2 flex flex-wrap gap-1" aria-label={adminContent.brand}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `min-h-[40px] inline-flex items-center px-3 rounded-lg text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-[var(--accent-gold)]/15 text-[var(--accent-gold)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};
