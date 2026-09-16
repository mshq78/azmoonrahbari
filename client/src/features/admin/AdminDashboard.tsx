import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ATTEMPT_STATUSES } from '@shared/contracts/constants';
import { adminContent, characterLabel, formatDateTime, toFaDigits } from '../../content/admin.fa';
import { adminApi } from '@/services/adminApi';
import { adminQueryKeys } from './AdminShell';
import { BarList, InlineError, Panel, StatTile, TableWrap, Td, Th, Badge } from './components';

export const AdminDashboard: React.FC = () => {
  const dashboard = useQuery({
    queryKey: adminQueryKeys.dashboard,
    queryFn: ({ signal }) => adminApi.dashboard(signal),
  });

  if (dashboard.isPending) {
    return <p className="text-[var(--text-secondary)]">{adminContent.common.loading}</p>;
  }
  if (dashboard.isError) return <InlineError message={dashboard.error.message} />;

  const data = dashboard.data;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">{adminContent.dashboard.title}</h1>

      {!data.publishedVersion && (
        <p
          role="status"
          className="text-sm leading-relaxed text-[var(--text-secondary)] bg-[var(--surface-highlight)] border border-[var(--accent-gold)]/40 rounded-xl px-4 py-3"
        >
          {adminContent.dashboard.noPublishedVersion}
        </p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          label={adminContent.dashboard.participants}
          value={toFaDigits(data.totals.participants)}
        />
        <StatTile
          label={adminContent.dashboard.attempts}
          value={toFaDigits(data.totals.attempts)}
        />
        <StatTile
          label={adminContent.dashboard.activeQuestions}
          value={toFaDigits(data.totals.activeQuestions)}
        />
        <StatTile
          label={adminContent.dashboard.publishedVersion}
          value={
            data.publishedVersion
              ? toFaDigits(data.publishedVersion.versionNumber)
              : adminContent.common.none
          }
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title={adminContent.dashboard.distribution}>
          <BarList
            items={data.characterDistribution.map((character) => ({
              key: character.code,
              label: character.displayName,
              count: character.count,
            }))}
            emptyLabel={adminContent.dashboard.noData}
          />
        </Panel>

        <Panel title={adminContent.dashboard.byStatus}>
          <BarList
            items={ATTEMPT_STATUSES.map((status) => ({
              key: status,
              label: adminContent.status[status],
              count: data.attemptsByStatus[status] ?? 0,
            }))}
            emptyLabel={adminContent.dashboard.noData}
          />
        </Panel>
      </div>

      <Panel title={adminContent.dashboard.latest}>
        {data.latestAttempts.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">{adminContent.dashboard.noData}</p>
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>{adminContent.participants.columns.name}</Th>
                <Th>{adminContent.participants.columns.status}</Th>
                <Th>{adminContent.participants.columns.result}</Th>
                <Th>{adminContent.participants.columns.lastActivity}</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {data.latestAttempts.map((attempt) => (
                <tr key={attempt.id}>
                  <Td>
                    {attempt.firstName} {attempt.lastName}
                  </Td>
                  <Td>
                    <Badge tone={attempt.status === 'Completed' ? 'gold' : 'neutral'}>
                      {adminContent.status[attempt.status]}
                    </Badge>
                  </Td>
                  <Td>{characterLabel(attempt.resultCharacterCode)}</Td>
                  <Td>{formatDateTime(attempt.lastActivityAt)}</Td>
                  <Td>
                    <Link
                      to={`/admin/attempts/${attempt.id}`}
                      className="text-[var(--accent-gold)] font-semibold hover:underline"
                    >
                      {adminContent.participants.view}
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>
    </div>
  );
};
