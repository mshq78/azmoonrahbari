import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ATTEMPT_STATUSES, type AttemptStatus } from '@shared/contracts/constants';
import { adminContent, characterLabel, formatDateTime, toFaDigits } from '../../content/admin.fa';
import { adminApi } from '@/services/adminApi';
import { adminQueryKeys } from './AdminShell';
import { Badge, InlineError, Pager, Panel, TableWrap, Td, Th } from './components';

const PAGE_SIZE = 25;

interface Filters {
  q: string;
  status: AttemptStatus | '';
  versionId: number | '';
  orgCode: string;
}

const EMPTY_FILTERS: Filters = { q: '', status: '', versionId: '', orgCode: '' };

export const AdminParticipants: React.FC = () => {
  const [page, setPage] = useState(1);
  // Draft state is what the inputs show; `applied` is what the server sees, so
  // typing does not fire a request per keystroke.
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);

  const versions = useQuery({
    queryKey: adminQueryKeys.versions,
    queryFn: ({ signal }) => adminApi.versions(signal),
    staleTime: 60_000,
  });

  const params = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      ...(applied.q ? { q: applied.q } : {}),
      ...(applied.status ? { status: applied.status } : {}),
      ...(applied.versionId ? { versionId: applied.versionId } : {}),
      ...(applied.orgCode ? { orgCode: applied.orgCode } : {}),
    }),
    [page, applied],
  );

  const list = useQuery({
    queryKey: adminQueryKeys.participants(params),
    queryFn: ({ signal }) => adminApi.participants(params, signal),
  });

  const applyFilters = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    setApplied(draft);
  };

  const resetFilters = () => {
    setPage(1);
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
  };

  const controlClass =
    'min-h-[44px] px-3 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-app)] text-[var(--text-primary)] text-sm';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">{adminContent.participants.title}</h1>
        <a
          href={adminApi.exportUrl({
            ...(applied.status ? { status: applied.status } : {}),
            ...(applied.versionId ? { versionId: applied.versionId } : {}),
            ...(applied.orgCode ? { orgCode: applied.orgCode } : {}),
          })}
          className="min-h-[44px] inline-flex items-center px-4 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-app)] text-sm font-semibold hover:border-[var(--accent-gold)]"
        >
          {adminContent.participants.exportCsv}
        </a>
      </div>

      <Panel>
        <form onSubmit={applyFilters} className="flex flex-wrap items-end gap-2">
          <input
            type="search"
            value={draft.q}
            onChange={(event) => setDraft((prev) => ({ ...prev, q: event.target.value }))}
            placeholder={adminContent.participants.searchPlaceholder}
            aria-label={adminContent.common.search}
            className={`${controlClass} flex-1 min-w-[220px]`}
          />

          <select
            value={draft.status}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, status: event.target.value as Filters['status'] }))
            }
            aria-label={adminContent.participants.columns.status}
            className={controlClass}
          >
            <option value="">{adminContent.participants.allStatuses}</option>
            {ATTEMPT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {adminContent.status[status]}
              </option>
            ))}
          </select>

          <select
            value={draft.versionId}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                versionId: event.target.value ? Number(event.target.value) : '',
              }))
            }
            aria-label={adminContent.participants.columns.version}
            className={controlClass}
          >
            <option value="">{adminContent.participants.allVersions}</option>
            {(versions.data?.items ?? []).map((version) => (
              <option key={version.id} value={version.id}>
                {toFaDigits(version.versionNumber)}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={draft.orgCode}
            onChange={(event) => setDraft((prev) => ({ ...prev, orgCode: event.target.value }))}
            placeholder={adminContent.participants.orgCodePlaceholder}
            aria-label={adminContent.participants.columns.orgCode}
            className={`${controlClass} w-36`}
          />

          <button
            type="submit"
            className="min-h-[44px] px-4 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] text-sm font-semibold"
          >
            {adminContent.common.filter}
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="min-h-[44px] px-4 rounded-lg border border-[var(--border-subtle)] text-sm font-semibold"
          >
            {adminContent.common.clear}
          </button>
        </form>
      </Panel>

      <Panel>
        {list.isPending && (
          <p className="text-sm text-[var(--text-secondary)]">{adminContent.common.loading}</p>
        )}
        {list.isError && <InlineError message={list.error.message} />}

        {list.data && list.data.items.length === 0 && (
          <p className="text-sm text-[var(--text-muted)]">{adminContent.participants.empty}</p>
        )}

        {list.data && list.data.items.length > 0 && (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <Th>{adminContent.participants.columns.name}</Th>
                  <Th>{adminContent.participants.columns.mobile}</Th>
                  <Th>{adminContent.participants.columns.orgCode}</Th>
                  <Th>{adminContent.participants.columns.status}</Th>
                  <Th>{adminContent.participants.columns.version}</Th>
                  <Th>{adminContent.participants.columns.result}</Th>
                  <Th>{adminContent.participants.columns.trackingCode}</Th>
                  <Th>{adminContent.participants.columns.lastActivity}</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {list.data.items.map((attempt) => (
                  <tr key={attempt.id}>
                    <Td>
                      {attempt.firstName} {attempt.lastName}
                    </Td>
                    <Td className="font-mono" >
                      <span dir="ltr">{attempt.mobile}</span>
                    </Td>
                    <Td>{attempt.orgCode ?? adminContent.common.none}</Td>
                    <Td>
                      <Badge tone={attempt.status === 'Completed' ? 'gold' : 'neutral'}>
                        {adminContent.status[attempt.status]}
                      </Badge>
                    </Td>
                    <Td>{toFaDigits(attempt.versionNumber)}</Td>
                    <Td>{characterLabel(attempt.resultCharacterCode)}</Td>
                    <Td className="font-mono">
                      <span dir="ltr">{attempt.trackingCode ?? adminContent.common.none}</span>
                    </Td>
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

            <Pager
              page={list.data.page}
              totalPages={list.data.totalPages}
              total={list.data.total}
              onChange={setPage}
            />
          </>
        )}
      </Panel>
    </div>
  );
};
