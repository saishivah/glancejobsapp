import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import {
  addSavedJob,
  listSavedJobs,
  removeSavedJob,
  updateSavedJobStatus,
  type AddSavedJobInput,
} from '../api/savedJobs';
import type { SavedJob, SavedJobStatus } from '../types/savedJob';

export const SAVED_JOBS_KEY = ['savedJobs'] as const;

export function useSavedJobs(enabled: boolean): UseQueryResult<SavedJob[], Error> {
  return useQuery<SavedJob[], Error>({
    queryKey: SAVED_JOBS_KEY,
    queryFn: ({ signal }) => listSavedJobs(signal),
    enabled,
    staleTime: 30_000,
    retry: (failureCount, error) => {
      const status = (error as { status?: number }).status;
      if (status === 401) return false;
      return failureCount < 2;
    },
  });
}

export function useAddSavedJob() {
  const queryClient = useQueryClient();
  return useMutation<SavedJob, Error, AddSavedJobInput>({
    mutationFn: addSavedJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAVED_JOBS_KEY });
    },
  });
}

export function useUpdateSavedJobStatus() {
  const queryClient = useQueryClient();
  return useMutation<{ id: number; status: SavedJobStatus }, Error, { id: number; status: SavedJobStatus }>({
    mutationFn: ({ id, status }) => updateSavedJobStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAVED_JOBS_KEY });
    },
  });
}

export function useRemoveSavedJob() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, number>({
    mutationFn: removeSavedJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAVED_JOBS_KEY });
    },
  });
}
