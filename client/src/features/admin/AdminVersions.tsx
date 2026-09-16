import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminContent, formatDateTime, toFaDigits } from '../../content/admin.fa';
import { adminApi } from '@/services/adminApi';
import { adminQueryKeys } from './AdminShell';
import { Badge, ConfirmDialog, InlineError, Panel, TableWrap, Td, Th } from './components';

export const AdminVersions: React.FC = () => {
  const queryClient = useQueryClient();
  const [publishTarget, setPublishTarget] = useState<number | null>(null);

  const versions = useQuery({
    queryKey: adminQueryKeys.versions,
    queryFn: ({ signal }) => adminApi.versions(signal),
  });

  const clone = useMutation({
    mutationFn: adminApi.cloneActiveVersion,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  });

  const publish = useMutation({
    mutationFn: (id: number) => adminApi.publishVersion(id),
    onSuccess: async () => {
      setPublishTarget(null);
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">{adminContent.versions.title}</h1>
        <button
          type="button"
          onClick={() => clone.mutate()}
          disabled={clone.isPending}
          className="min-h-[44px] px-4 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] text-sm font-semibold disabled:opacity-50"
        >
          {adminContent.versions.cloneActive}
        </button>
      </div>

      <InlineError message={clone.error?.message} />

      <Panel>
        {versions.isPending && (
          <p className="text-sm text-[var(--text-secondary)]">{adminContent.common.loading}</p>
        )}
        {versions.isError && <InlineError message={versions.error.message} />}

        {versions.data && (
          <TableWrap>
            <thead>
              <tr>
                <Th>{adminContent.versions.columns.versionNumber}</Th>
                <Th>{adminContent.versions.columns.status}</Th>
                <Th>{adminContent.versions.columns.questions}</Th>
                <Th>{adminContent.versions.columns.attempts}</Th>
                <Th>{adminContent.versions.columns.publishedAt}</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {versions.data.items.map((version) => (
                <tr key={version.id}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{toFaDigits(version.versionNumber)}</span>
                      {version.isActive && (
                        <Badge tone="gold">{adminContent.versions.activeBadge}</Badge>
                      )}
                    </div>
                  </Td>
                  <Td>{adminContent.versionStatus[version.status]}</Td>
                  <Td>{toFaDigits(version.activeQuestionCount)}</Td>
                  <Td>{toFaDigits(version.attemptCount)}</Td>
                  <Td>{formatDateTime(version.publishedAt)}</Td>
                  <Td>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/admin/versions/${version.id}/questions`}
                        className="text-[var(--accent-gold)] font-semibold hover:underline whitespace-nowrap"
                      >
                        {adminContent.versions.manageQuestions}
                      </Link>
                      {version.status === 'Draft' && (
                        <button
                          type="button"
                          onClick={() => setPublishTarget(version.id)}
                          className="min-h-[36px] px-3 rounded-lg border border-[var(--border-strong)] text-xs font-semibold hover:border-[var(--accent-gold)]"
                        >
                          {adminContent.versions.publish}
                        </button>
                      )}
                      <Badge tone="muted">
                        {version.editable
                          ? adminContent.versions.editable
                          : adminContent.versions.locked}
                      </Badge>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>

      <ConfirmDialog
        open={publishTarget !== null}
        title={adminContent.versions.publishConfirmTitle}
        body={adminContent.versions.publishConfirmBody}
        confirmLabel={adminContent.versions.publish}
        pending={publish.isPending}
        error={publish.error?.message}
        onCancel={() => setPublishTarget(null)}
        onConfirm={() => publishTarget !== null && publish.mutate(publishTarget)}
      />
    </div>
  );
};
