import React, { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminContent, formatBytes, formatDateTime, toFaDigits } from '../../content/admin.fa';
import { adminApi } from '@/services/adminApi';
import { adminQueryKeys } from './AdminShell';
import { Badge, ConfirmDialog, InlineError, Pager, Panel, TableWrap, Td, Th } from './components';

export const AdminMedia: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const media = useQuery({
    queryKey: adminQueryKeys.media(page),
    queryFn: ({ signal }) => adminApi.media({ page, pageSize: 20 }, signal),
  });

  const upload = useMutation({
    mutationFn: (file: File) => adminApi.uploadMedia(file),
    onSuccess: async () => {
      if (fileInput.current) fileInput.current.value = '';
      await queryClient.invalidateQueries({ queryKey: ['admin', 'media'] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => adminApi.deleteMedia(id),
    onSuccess: async () => {
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'media'] });
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{adminContent.media.title}</h1>

      <Panel title={adminContent.media.upload}>
        <div className="space-y-2">
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label={adminContent.media.upload}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) upload.mutate(file);
            }}
            className="block w-full text-sm text-[var(--text-secondary)] file:min-h-[40px] file:px-4 file:rounded-lg file:border-0 file:bg-[var(--btn-primary-bg)] file:text-[var(--btn-primary-text)] file:text-sm file:font-semibold file:ml-3"
          />
          <p className="text-xs text-[var(--text-muted)]">{adminContent.media.uploadHint}</p>
          <InlineError message={upload.error?.message} />
        </div>
      </Panel>

      <Panel>
        {media.isPending && (
          <p className="text-sm text-[var(--text-secondary)]">{adminContent.common.loading}</p>
        )}
        {media.isError && <InlineError message={media.error.message} />}

        {media.data && media.data.items.length === 0 && (
          <p className="text-sm text-[var(--text-muted)]">{adminContent.media.empty}</p>
        )}

        {media.data && media.data.items.length > 0 && (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <Th>{adminContent.media.columns.preview}</Th>
                  <Th>{adminContent.media.columns.name}</Th>
                  <Th>{adminContent.media.columns.type}</Th>
                  <Th>{adminContent.media.columns.size}</Th>
                  <Th>{adminContent.media.columns.references}</Th>
                  <Th>{adminContent.media.columns.createdAt}</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {media.data.items.map((asset) => (
                  <tr key={asset.id}>
                    <Td>
                      <img
                        src={asset.url}
                        alt=""
                        className="w-14 h-14 object-cover rounded border border-[var(--border-subtle)]"
                      />
                    </Td>
                    <Td className="max-w-[220px] break-all">{asset.originalName}</Td>
                    <Td>{asset.mimeType}</Td>
                    <Td>{formatBytes(asset.sizeBytes)}</Td>
                    <Td>
                      {asset.referenceCount > 0 ? (
                        <Badge tone="gold">
                          {adminContent.media.inUse} ({toFaDigits(asset.referenceCount)})
                        </Badge>
                      ) : (
                        toFaDigits(0)
                      )}
                    </Td>
                    <Td>{formatDateTime(asset.createdAt)}</Td>
                    <Td>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(asset.id)}
                        disabled={asset.referenceCount > 0}
                        className="min-h-[36px] px-3 rounded-lg border border-red-700/60 text-red-700 dark:text-red-400 text-xs font-semibold hover:bg-red-500/10 disabled:opacity-40 disabled:hover:bg-transparent"
                      >
                        {adminContent.media.delete}
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>

            <Pager
              page={media.data.page}
              totalPages={media.data.totalPages}
              total={media.data.total}
              onChange={setPage}
            />
          </>
        )}
      </Panel>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={adminContent.media.deleteConfirmTitle}
        body={adminContent.media.deleteConfirmBody}
        confirmLabel={adminContent.media.delete}
        destructive
        pending={remove.isPending}
        error={remove.error?.message}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget !== null && remove.mutate(deleteTarget)}
      />
    </div>
  );
};
