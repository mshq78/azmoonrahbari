import { useEffect, useSyncExternalStore } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BootstrapResponse, FinalizeResponse } from '@shared/types/public-api';
import { fetchBootstrap, fetchConfig, finalize, startOrResume } from '@/services/api';
import { type ApiError } from '@/services/http';
import { attemptStore, type AttemptSnapshot } from './attemptStore';

export const queryKeys = {
  config: ['public', 'config'] as const,
  bootstrap: ['public', 'bootstrap'] as const,
};

/** Reactive view of the local answer cache and its sync status. */
export function useAttemptSnapshot(): AttemptSnapshot {
  return useSyncExternalStore(attemptStore.subscribe, attemptStore.getSnapshot, attemptStore.getSnapshot);
}

export function useConfig() {
  return useQuery({
    queryKey: queryKeys.config,
    queryFn: ({ signal }) => fetchConfig(signal),
    staleTime: 60_000,
    retry: 1,
  });
}

/**
 * The bootstrap query drives every public screen. A 401 is an expected
 * outcome — the participant simply has no session yet — so it never retries
 * and never surfaces as an error screen.
 */
export function useBootstrap(enabled = true) {
  const query = useQuery<BootstrapResponse, ApiError>({
    queryKey: queryKeys.bootstrap,
    queryFn: ({ signal }) => fetchBootstrap(signal),
    enabled,
    retry: (failureCount, error) => !error.isUnauthenticated && failureCount < 2,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  // Every fresh bootstrap re-merges the local cache against the server.
  useEffect(() => {
    if (query.data) void attemptStore.hydrate(query.data);
  }, [query.data]);

  return query;
}

export function useStartOrResume() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: startOrResume,
    onSuccess: async (data) => {
      queryClient.setQueryData(queryKeys.bootstrap, data);
      await attemptStore.hydrate(data);
    },
  });
}

export function useFinalize() {
  const queryClient = useQueryClient();

  return useMutation<FinalizeResponse, ApiError>({
    mutationFn: async () => {
      // Send anything still queued first, so the snapshot the server scores
      // matches what the participant last saw.
      await attemptStore.flush();
      const answers = await attemptStore.finalizePayload();
      const idempotencyKey = await attemptStore.takeFinalizeKey();
      return finalize({ answers, idempotencyKey });
    },
    onSuccess: async (result) => {
      // Apply the outcome to the cached bootstrap straight away. The server has
      // already decided; waiting for a refetch would let the next screen render
      // against stale data and bounce the participant somewhere else.
      queryClient.setQueryData<BootstrapResponse>(queryKeys.bootstrap, (previous) => {
        if (!previous) return previous;

        if (result.outcome === 'completed') {
          return {
            ...previous,
            attempt: {
              ...previous.attempt,
              status: 'Completed',
              trackingCode: result.trackingCode,
              completedAt: result.completedAt,
            },
            tieBreak: null,
            result: result.result,
          };
        }

        return { ...previous, tieBreak: result.tieBreak, result: null };
      });

      if (result.outcome === 'tie_break_required') {
        // The next finalize is a distinct operation and needs a new key.
        await attemptStore.resetFinalizeKey();
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.bootstrap });
    },
  });
}
