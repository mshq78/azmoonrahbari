import { lazy, Suspense, type ReactNode } from 'react';
import { Route } from 'react-router-dom';
import { adminContent } from '../../content/admin.fa';

/**
 * The admin panel is lazily loaded: participants make up almost all traffic and
 * should never download the management UI.
 */
const AdminShell = lazy(() =>
  import('./AdminShell').then((m) => ({ default: m.AdminShell })),
);
const AdminDashboard = lazy(() =>
  import('./AdminDashboard').then((m) => ({ default: m.AdminDashboard })),
);
const AdminParticipants = lazy(() =>
  import('./AdminParticipants').then((m) => ({ default: m.AdminParticipants })),
);
const AdminAttemptDetail = lazy(() =>
  import('./AdminAttemptDetail').then((m) => ({ default: m.AdminAttemptDetail })),
);
const AdminVersions = lazy(() =>
  import('./AdminVersions').then((m) => ({ default: m.AdminVersions })),
);
const AdminQuestions = lazy(() =>
  import('./AdminQuestions').then((m) => ({ default: m.AdminQuestions })),
);
const AdminMedia = lazy(() =>
  import('./AdminMedia').then((m) => ({ default: m.AdminMedia })),
);

const withSuspense = (node: ReactNode) => (
  <Suspense
    fallback={
      <div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)]">
        {adminContent.common.loading}
      </div>
    }
  >
    {node}
  </Suspense>
);

/** Admin routes, mounted inside the same SPA and behind the same-origin session. */
export const adminRoutes = (
  <Route path="/admin" element={withSuspense(<AdminShell />)}>
    <Route index element={withSuspense(<AdminDashboard />)} />
    <Route path="participants" element={withSuspense(<AdminParticipants />)} />
    <Route path="attempts/:id" element={withSuspense(<AdminAttemptDetail />)} />
    <Route path="versions" element={withSuspense(<AdminVersions />)} />
    <Route path="versions/:versionId/questions" element={withSuspense(<AdminQuestions />)} />
    <Route path="media" element={withSuspense(<AdminMedia />)} />
  </Route>
);
