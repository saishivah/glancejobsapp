import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { ApiError } from '../api/client';
import {
  getResumeHistory,
  getResumeHistoryItem,
  getResumeUsage,
  getRootResume,
  saveRootResume,
  tailorResume,
} from '../api/resume';
import type {
  ResumeHistoryDetail,
  ResumeHistoryItem,
  ResumeUsage,
  RootResume,
  TailorResumeInput,
  TailorResumeResult,
} from '../types/resume';

export const ROOT_RESUME_KEY = ['rootResume'] as const;
export const RESUME_USAGE_KEY = ['resumeUsage'] as const;
export const RESUME_HISTORY_KEY = ['resumeHistory'] as const;

export function useRootResume(enabled: boolean): UseQueryResult<RootResume, Error> {
  return useQuery<RootResume, Error>({
    queryKey: ROOT_RESUME_KEY,
    queryFn: ({ signal }) => getRootResume(signal),
    enabled,
    staleTime: 30_000,
    retry: (failureCount, error) => {
      const status = error instanceof ApiError ? error.status : undefined;
      if (status === 404 || status === 401) return false;
      return failureCount < 2;
    },
  });
}

export function useSaveRootResume() {
  const queryClient = useQueryClient();
  return useMutation<RootResume, Error, string>({
    mutationFn: saveRootResume,
    onSuccess: (data) => {
      queryClient.setQueryData(ROOT_RESUME_KEY, data);
    },
  });
}

function bailOnAuthError(failureCount: number, error: Error): boolean {
  const status = error instanceof ApiError ? error.status : undefined;
  if (status === 401) return false;
  return failureCount < 2;
}

export function useResumeUsage(enabled: boolean): UseQueryResult<ResumeUsage, Error> {
  return useQuery<ResumeUsage, Error>({
    queryKey: RESUME_USAGE_KEY,
    queryFn: ({ signal }) => getResumeUsage(signal),
    enabled,
    staleTime: 10_000,
    retry: bailOnAuthError,
  });
}

export function useResumeHistory(enabled: boolean): UseQueryResult<ResumeHistoryItem[], Error> {
  return useQuery<ResumeHistoryItem[], Error>({
    queryKey: RESUME_HISTORY_KEY,
    queryFn: ({ signal }) => getResumeHistory(signal),
    enabled,
    staleTime: 10_000,
    retry: bailOnAuthError,
  });
}

export function useResumeHistoryItem() {
  return useMutation<ResumeHistoryDetail, Error, string>({
    mutationFn: (id) => getResumeHistoryItem(id),
  });
}

export function useTailorResume() {
  const queryClient = useQueryClient();
  return useMutation<TailorResumeResult, Error, TailorResumeInput>({
    mutationFn: tailorResume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESUME_HISTORY_KEY });
      queryClient.invalidateQueries({ queryKey: RESUME_USAGE_KEY });
    },
  });
}
