import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CHARACTER_CODES, type CharacterCode } from '@shared/contracts/constants';
import type { AdminOption, AdminQuestion } from '@shared/types/admin-api';
import { adminContent, toFaDigits } from '../../content/admin.fa';
import { adminApi } from '@/services/adminApi';
import { ApiError } from '@/services/http';
import { adminQueryKeys } from './AdminShell';
import { Badge, InlineError, Panel } from './components';

const controlClass =
  'min-h-[40px] px-3 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-app)] text-[var(--text-primary)] text-sm';
const smallButton =
  'min-h-[36px] px-3 rounded-lg border border-[var(--border-subtle)] text-xs font-semibold hover:border-[var(--accent-gold)] disabled:opacity-40';

export const AdminQuestions: React.FC = () => {
  const { versionId: versionIdParam } = useParams<{ versionId: string }>();
  const versionId = Number(versionIdParam);
  const queryClient = useQueryClient();

  const versions = useQuery({
    queryKey: adminQueryKeys.versions,
    queryFn: ({ signal }) => adminApi.versions(signal),
  });

  const questions = useQuery({
    queryKey: adminQueryKeys.questions(versionId),
    queryFn: ({ signal }) => adminApi.versionQuestions(versionId, signal),
    enabled: Number.isInteger(versionId) && versionId > 0,
  });

  const version = versions.data?.items.find((item) => item.id === versionId);
  const editable = version?.editable ?? false;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.questions(versionId) });

  const updateQuestion = useMutation({
    mutationFn: ({ id, ...input }: { id: number; text?: string; isActive?: boolean }) =>
      adminApi.updateQuestion(id, input),
    onSuccess: invalidate,
  });

  const reorder = useMutation({
    mutationFn: (orderedIds: number[]) => adminApi.reorderQuestions(versionId, orderedIds),
    onSuccess: invalidate,
  });

  const createQuestion = useMutation({
    mutationFn: (input: { code: string; text: string; isTieBreaker: boolean }) =>
      adminApi.createQuestion(versionId, input),
    onSuccess: invalidate,
  });

  const [newCode, setNewCode] = useState('');
  const [newText, setNewText] = useState('');
  const [newIsTieBreaker, setNewIsTieBreaker] = useState(false);

  const items = questions.data?.items ?? [];

  const move = (index: number, direction: -1 | 1) => {
    const next = [...items];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorder.mutate(next.map((question) => question.id));
  };

  const mutationError =
    updateQuestion.error ?? reorder.error ?? createQuestion.error ?? undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">
          {adminContent.questions.title}
          {version && (
            <span className="text-sm font-normal text-[var(--text-muted)] mr-2">
              ({adminContent.versions.columns.versionNumber} {toFaDigits(version.versionNumber)})
            </span>
          )}
        </h1>
        <Link
          to="/admin/versions"
          className="text-sm font-semibold text-[var(--accent-gold)] hover:underline"
        >
          {adminContent.versions.title}
        </Link>
      </div>

      {!editable && version && (
        <p
          role="status"
          className="text-sm leading-relaxed text-[var(--text-secondary)] bg-[var(--surface-highlight)] border border-[var(--accent-gold)]/40 rounded-xl px-4 py-3"
        >
          {adminContent.questions.lockedNotice}
        </p>
      )}

      <InlineError
        message={mutationError instanceof ApiError ? mutationError.message : undefined}
      />

      {editable && (
        <Panel title={adminContent.questions.add}>
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!newCode.trim() || !newText.trim()) return;
              createQuestion.mutate(
                { code: newCode.trim(), text: newText.trim(), isTieBreaker: newIsTieBreaker },
                {
                  onSuccess: () => {
                    setNewCode('');
                    setNewText('');
                    setNewIsTieBreaker(false);
                  },
                },
              );
            }}
          >
            <input
              value={newCode}
              onChange={(event) => setNewCode(event.target.value)}
              placeholder={adminContent.questions.codeLabel}
              aria-label={adminContent.questions.codeLabel}
              dir="ltr"
              className={`${controlClass} w-24 text-left`}
            />
            <input
              value={newText}
              onChange={(event) => setNewText(event.target.value)}
              placeholder={adminContent.questions.textLabel}
              aria-label={adminContent.questions.textLabel}
              className={`${controlClass} flex-1 min-w-[240px]`}
            />
            <label className="flex items-center gap-2 text-sm min-h-[40px]">
              <input
                type="checkbox"
                checked={newIsTieBreaker}
                onChange={(event) => setNewIsTieBreaker(event.target.checked)}
              />
              {adminContent.questions.tieBreakerLabel}
            </label>
            <button
              type="submit"
              disabled={createQuestion.isPending}
              className="min-h-[40px] px-4 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] text-sm font-semibold disabled:opacity-50"
            >
              {adminContent.common.save}
            </button>
          </form>
        </Panel>
      )}

      {questions.isPending && (
        <p className="text-sm text-[var(--text-secondary)]">{adminContent.common.loading}</p>
      )}
      {questions.isError && <InlineError message={questions.error.message} />}

      <div className="space-y-3">
        {items.map((question, index) => (
          <QuestionEditor
            key={question.id}
            question={question}
            index={index}
            total={items.length}
            editable={editable}
            onMove={move}
            onUpdate={(input) => updateQuestion.mutate({ id: question.id, ...input })}
            onChanged={invalidate}
          />
        ))}
      </div>

      <p className="text-xs text-[var(--text-muted)]">{adminContent.questions.minOptionsHint}</p>
    </div>
  );
};

const QuestionEditor: React.FC<{
  question: AdminQuestion;
  index: number;
  total: number;
  editable: boolean;
  onMove: (index: number, direction: -1 | 1) => void;
  onUpdate: (input: { text?: string; isActive?: boolean }) => void;
  onChanged: () => void;
}> = ({ question, index, total, editable, onMove, onUpdate, onChanged }) => {
  const [text, setText] = useState(question.text);
  const [showPreview, setShowPreview] = useState(false);

  const dirty = text !== question.text;

  return (
    <Panel
      title={`${question.code} — ${adminContent.questions.orderLabel} ${toFaDigits(question.displayOrder)}`}
      actions={
        <>
          {question.isTieBreaker && (
            <Badge tone="gold">{adminContent.questions.tieBreakerBadge}</Badge>
          )}
          <Badge tone={question.isActive ? 'neutral' : 'muted'}>
            {question.isActive ? adminContent.common.active : adminContent.common.inactive}
          </Badge>
          <button
            type="button"
            className={smallButton}
            onClick={() => setShowPreview((value) => !value)}
          >
            {adminContent.questions.preview}
          </button>
          <button
            type="button"
            className={smallButton}
            disabled={!editable || index === 0}
            onClick={() => onMove(index, -1)}
          >
            {adminContent.questions.moveUp}
          </button>
          <button
            type="button"
            className={smallButton}
            disabled={!editable || index === total - 1}
            onClick={() => onMove(index, 1)}
          >
            {adminContent.questions.moveDown}
          </button>
          <button
            type="button"
            className={smallButton}
            disabled={!editable}
            onClick={() => onUpdate({ isActive: !question.isActive })}
          >
            {question.isActive
              ? adminContent.questions.deactivate
              : adminContent.questions.activate}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label
            htmlFor={`q-${question.id}-text`}
            className="block text-xs text-[var(--text-muted)] mb-1"
          >
            {adminContent.questions.textLabel}
          </label>
          <textarea
            id={`q-${question.id}-text`}
            value={text}
            disabled={!editable}
            onChange={(event) => setText(event.target.value)}
            rows={2}
            className={`${controlClass} w-full py-2 resize-y disabled:opacity-70`}
          />
          {editable && dirty && (
            <button
              type="button"
              onClick={() => onUpdate({ text })}
              className="mt-2 min-h-[36px] px-3 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] text-xs font-semibold"
            >
              {adminContent.common.save}
            </button>
          )}
        </div>

        {showPreview && (
          <div className="rounded-lg border border-[var(--accent-gold)]/40 bg-[var(--surface-muted)] p-4 text-right">
            <div className="text-xs text-[var(--accent-gold)] font-bold mb-2">
              {adminContent.questions.previewTitle}
            </div>
            <p className="text-[17px] font-semibold text-[var(--text-primary)] mb-3">
              {question.text}
            </p>
            <ul className="space-y-2">
              {question.options
                .filter((option) => option.isActive)
                .map((option) => (
                  <li
                    key={option.id}
                    className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-app)] px-3 py-2 text-[16px]"
                  >
                    {option.text}
                  </li>
                ))}
            </ul>
          </div>
        )}

        <OptionsEditor
          question={question}
          editable={editable}
          onChanged={onChanged}
        />
      </div>
    </Panel>
  );
};

const OptionsEditor: React.FC<{
  question: AdminQuestion;
  editable: boolean;
  onChanged: () => void;
}> = ({ question, editable, onChanged }) => {
  const [code, setCode] = useState('');
  const [text, setText] = useState('');
  const [internalValue, setInternalValue] = useState<CharacterCode>(CHARACTER_CODES[0]);

  const createOption = useMutation({
    mutationFn: () =>
      adminApi.createOption(question.id, {
        code: code.trim(),
        text: text.trim(),
        internalValue,
        score: 1,
      }),
    onSuccess: () => {
      setCode('');
      setText('');
      onChanged();
    },
  });

  return (
    <div className="space-y-2">
      <div className="text-xs text-[var(--text-muted)]">{adminContent.questions.options}</div>

      {question.options.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">{adminContent.questions.noOptions}</p>
      ) : (
        <ul className="space-y-2">
          {question.options.map((option) => (
            <OptionRowEditor
              key={option.id}
              option={option}
              editable={editable}
              onChanged={onChanged}
            />
          ))}
        </ul>
      )}

      <InlineError message={createOption.error?.message} />

      {editable && (
        <form
          className="flex flex-wrap items-end gap-2 pt-1"
          onSubmit={(event) => {
            event.preventDefault();
            if (!code.trim() || !text.trim()) return;
            createOption.mutate();
          }}
        >
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder={adminContent.questions.optionCode}
            aria-label={adminContent.questions.optionCode}
            dir="ltr"
            className={`${controlClass} w-20 text-left`}
          />
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={adminContent.questions.optionText}
            aria-label={adminContent.questions.optionText}
            className={`${controlClass} flex-1 min-w-[220px]`}
          />
          <select
            value={internalValue}
            onChange={(event) => setInternalValue(event.target.value as CharacterCode)}
            aria-label={adminContent.questions.internalValue}
            className={controlClass}
          >
            {CHARACTER_CODES.map((characterCode) => (
              <option key={characterCode} value={characterCode}>
                {characterCode}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={createOption.isPending}
            className="min-h-[40px] px-4 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] text-sm font-semibold disabled:opacity-50"
          >
            {adminContent.questions.addOption}
          </button>
        </form>
      )}
    </div>
  );
};

const OptionRowEditor: React.FC<{
  option: AdminOption;
  editable: boolean;
  onChanged: () => void;
}> = ({ option, editable, onChanged }) => {
  const [text, setText] = useState(option.text);
  const [internalValue, setInternalValue] = useState<CharacterCode>(option.internalValue);
  const [score, setScore] = useState(option.score);

  const update = useMutation({
    mutationFn: (input: Parameters<typeof adminApi.updateOption>[1]) =>
      adminApi.updateOption(option.id, input),
    onSuccess: onChanged,
  });

  const dirty =
    text !== option.text ||
    internalValue !== option.internalValue ||
    Number(score) !== Number(option.score);

  return (
    <li className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-muted)]/40 p-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="muted">{option.code}</Badge>
        <input
          value={text}
          disabled={!editable}
          onChange={(event) => setText(event.target.value)}
          aria-label={adminContent.questions.optionText}
          className={`${controlClass} flex-1 min-w-[200px] disabled:opacity-70`}
        />
        <select
          value={internalValue}
          disabled={!editable}
          onChange={(event) => setInternalValue(event.target.value as CharacterCode)}
          aria-label={adminContent.questions.internalValue}
          className={`${controlClass} disabled:opacity-70`}
        >
          {CHARACTER_CODES.map((characterCode) => (
            <option key={characterCode} value={characterCode}>
              {characterCode}
            </option>
          ))}
        </select>
        <input
          type="number"
          step="0.25"
          min="0"
          value={score}
          disabled={!editable}
          onChange={(event) => setScore(event.target.value)}
          aria-label={adminContent.questions.score}
          className={`${controlClass} w-24 disabled:opacity-70`}
        />
        <button
          type="button"
          className={smallButton}
          disabled={!editable}
          onClick={() => update.mutate({ isActive: !option.isActive })}
        >
          {option.isActive ? adminContent.questions.deactivate : adminContent.questions.activate}
        </button>
        {editable && dirty && (
          <button
            type="button"
            onClick={() =>
              update.mutate({ text, internalValue, score: Number(score) })
            }
            className="min-h-[36px] px-3 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] text-xs font-semibold"
          >
            {adminContent.common.save}
          </button>
        )}
      </div>
      <InlineError message={update.error?.message} />
    </li>
  );
};
