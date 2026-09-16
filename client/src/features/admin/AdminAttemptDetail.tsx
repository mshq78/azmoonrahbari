import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminContent, characterLabel, formatDateTime, toFaDigits } from '../../content/admin.fa';
import { adminApi } from '@/services/adminApi';
import { adminQueryKeys } from './AdminShell';
import { Badge, ConfirmDialog, InlineError, Panel, TableWrap, Td, Th } from './components';

export const AdminAttemptDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const attemptId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [confirming, setConfirming] = useState<'reopen' | 'delete' | null>(null);

  const detail = useQuery({
    queryKey: adminQueryKeys.attempt(attemptId),
    queryFn: ({ signal }) => adminApi.attempt(attemptId, signal),
    enabled: Number.isInteger(attemptId) && attemptId > 0,
  });

  const reopen = useMutation({
    mutationFn: () => adminApi.reopenAttempt(attemptId),
    onSuccess: async () => {
      setConfirming(null);
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });

  const removeParticipant = useMutation({
    mutationFn: (participantId: number) => adminApi.deleteParticipant(participantId),
    onSuccess: async () => {
      setConfirming(null);
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
      navigate('/admin/participants', { replace: true });
    },
  });

  if (detail.isPending) {
    return <p className="text-[var(--text-secondary)]">{adminContent.common.loading}</p>;
  }
  if (detail.isError) return <InlineError message={detail.error.message} />;

  const { attempt, answers, resultScores, tiedCharacters } = detail.data;
  const fullName = `${attempt.firstName} ${attempt.lastName}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">{adminContent.attempt.title}</h1>
        <Link
          to="/admin/participants"
          className="text-sm font-semibold text-[var(--accent-gold)] hover:underline"
        >
          {adminContent.attempt.back}
        </Link>
      </div>

      <Panel title={adminContent.attempt.participant}>
        <dl className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 text-sm">
          <Field label={adminContent.participants.columns.name} value={fullName} />
          <Field label={adminContent.participants.columns.mobile} value={attempt.mobile} ltr />
          <Field
            label={adminContent.participants.columns.orgCode}
            value={attempt.orgCode ?? adminContent.common.none}
          />
          <Field
            label={adminContent.participants.columns.status}
            value={adminContent.status[attempt.status]}
          />
          <Field
            label={adminContent.participants.columns.version}
            value={toFaDigits(attempt.versionNumber)}
          />
          <Field
            label={adminContent.participants.columns.trackingCode}
            value={attempt.trackingCode ?? adminContent.common.none}
            ltr
          />
          <Field
            label={adminContent.participants.columns.lastActivity}
            value={formatDateTime(attempt.lastActivityAt)}
          />
          <Field
            label={adminContent.participants.columns.completedAt}
            value={formatDateTime(attempt.completedAt)}
          />
          <Field
            label={adminContent.attempt.reopenCount}
            value={toFaDigits(attempt.reopenCount)}
          />
          <Field
            label={adminContent.attempt.completionCycle}
            value={toFaDigits(detail.data.completionCycle)}
          />
        </dl>
      </Panel>

      <Panel title={adminContent.attempt.result}>
        {attempt.resultCharacterCode ? (
          <div className="space-y-3">
            <div className="text-lg font-bold text-[var(--text-primary)]">
              {characterLabel(attempt.resultCharacterCode)}{' '}
              <span className="text-sm font-normal text-[var(--text-muted)]">
                ({attempt.resultCharacterCode})
              </span>
            </div>
            {resultScores && (
              <div>
                <div className="text-xs text-[var(--text-muted)] mb-1.5">
                  {adminContent.attempt.scores}
                </div>
                <ul className="flex flex-wrap gap-2">
                  {Object.entries(resultScores).map(([code, score]) => (
                    <li key={code}>
                      <Badge>
                        {characterLabel(code)}: {toFaDigits(score)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="text-xs text-[var(--text-muted)]">
              {formatDateTime(detail.data.resultComputedAt)}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-[var(--text-muted)]">{adminContent.attempt.noResult}</p>
            {detail.data.tieBreakRequired && (
              <p className="text-sm text-[var(--text-secondary)]">
                {adminContent.attempt.tieBreakPending}
                {tiedCharacters && tiedCharacters.length > 0 && (
                  <>
                    {' — '}
                    {adminContent.attempt.tiedCharacters}:{' '}
                    {tiedCharacters.map(characterLabel).join('\u060C ')}
                  </>
                )}
              </p>
            )}
          </div>
        )}
      </Panel>

      <Panel title={adminContent.attempt.answers}>
        {answers.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">{adminContent.dashboard.noData}</p>
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>{adminContent.attempt.columns.question}</Th>
                <Th>{adminContent.attempt.columns.answer}</Th>
                <Th>{adminContent.attempt.columns.internalValue}</Th>
                <Th>{adminContent.attempt.columns.score}</Th>
              </tr>
            </thead>
            <tbody>
              {answers.map((answer) => (
                <tr key={answer.questionId}>
                  <Td>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge tone="muted">{answer.questionCode}</Badge>
                      {answer.isTieBreaker && (
                        <Badge tone="gold">{adminContent.attempt.tieBreakerBadge}</Badge>
                      )}
                    </div>
                    <div className="text-[var(--text-secondary)] max-w-md">
                      {answer.questionText}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge tone="muted">{answer.optionCode}</Badge>
                    </div>
                    <div className="max-w-md">{answer.optionText}</div>
                  </Td>
                  <Td>{characterLabel(answer.internalValue)}</Td>
                  <Td>{toFaDigits(answer.score)}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>

      <Panel title={adminContent.common.actions}>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setConfirming('reopen')}
            disabled={attempt.status !== 'Completed'}
            className="min-h-[44px] px-4 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-app)] text-sm font-semibold hover:border-[var(--accent-gold)] disabled:opacity-40"
          >
            {adminContent.attempt.reopen}
          </button>

          <button
            type="button"
            onClick={() => setConfirming('delete')}
            className="min-h-[44px] px-4 rounded-lg border border-red-700/60 text-red-700 dark:text-red-400 text-sm font-semibold hover:bg-red-500/10"
          >
            {adminContent.attempt.deleteParticipant}
          </button>
        </div>
      </Panel>

      <ConfirmDialog
        open={confirming === 'reopen'}
        title={adminContent.attempt.reopenConfirmTitle}
        body={adminContent.attempt.reopenConfirmBody}
        pending={reopen.isPending}
        error={reopen.error?.message}
        onCancel={() => setConfirming(null)}
        onConfirm={() => reopen.mutate()}
      />

      <ConfirmDialog
        open={confirming === 'delete'}
        title={adminContent.attempt.deleteConfirmTitle}
        body={adminContent.attempt.deleteConfirmBody}
        confirmLabel={adminContent.attempt.deleteParticipant}
        requirePhrase={fullName}
        requirePhraseLabel={adminContent.attempt.deleteConfirmPrompt(fullName)}
        destructive
        pending={removeParticipant.isPending}
        error={removeParticipant.error?.message}
        onCancel={() => setConfirming(null)}
        onConfirm={() => removeParticipant.mutate(attempt.participantId)}
      />
    </div>
  );
};

const Field: React.FC<{ label: string; value: string; ltr?: boolean }> = ({
  label,
  value,
  ltr = false,
}) => (
  <div>
    <dt className="text-xs text-[var(--text-muted)] mb-0.5">{label}</dt>
    <dd className={`font-semibold text-[var(--text-primary)] ${ltr ? 'font-mono' : ''}`}>
      {ltr ? <span dir="ltr">{value}</span> : value}
    </dd>
  </div>
);
