import { getIdTokenOrThrow, parseJsonOrThrow } from './client';
import { ENDPOINTS, apiUrl } from './endpoints';
import type {
  ResumeHistoryDetail,
  ResumeHistoryItem,
  ResumeUsage,
  RootResume,
  TailorResumeInput,
  TailorResumeResult,
} from '../types/resume';

// Typed wrappers around the resume-tailoring backend. All routes require a
// signed-in user — userId is derived server-side from the Firebase token.

async function authHeaders(extra?: Record<string, string>): Promise<HeadersInit> {
  const token = await getIdTokenOrThrow();
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}

export async function getRootResume(signal?: AbortSignal): Promise<RootResume> {
  const res = await fetch(`${apiUrl(ENDPOINTS.resumeRoot)}/`, {
    method: 'GET',
    headers: await authHeaders(),
    signal,
  });
  return parseJsonOrThrow<RootResume>(res);
}

export async function saveRootResume(resumeText: string): Promise<RootResume> {
  const res = await fetch(`${apiUrl(ENDPOINTS.resumeRoot)}/`, {
    method: 'POST',
    headers: await authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ resumeText }),
  });
  return parseJsonOrThrow<RootResume>(res);
}

export async function getResumeUsage(signal?: AbortSignal): Promise<ResumeUsage> {
  const res = await fetch(apiUrl(ENDPOINTS.resumeUsage), {
    method: 'GET',
    headers: await authHeaders(),
    signal,
  });
  return parseJsonOrThrow<ResumeUsage>(res);
}

export async function getResumeHistory(signal?: AbortSignal): Promise<ResumeHistoryItem[]> {
  const res = await fetch(apiUrl(ENDPOINTS.resumeHistory), {
    method: 'GET',
    headers: await authHeaders(),
    signal,
  });
  return parseJsonOrThrow<ResumeHistoryItem[]>(res);
}

export async function getResumeHistoryItem(id: string, signal?: AbortSignal): Promise<ResumeHistoryDetail> {
  const res = await fetch(`${apiUrl(ENDPOINTS.resumeHistory)}/${id}`, {
    method: 'GET',
    headers: await authHeaders(),
    signal,
  });
  return parseJsonOrThrow<ResumeHistoryDetail>(res);
}

export async function tailorResume(input: TailorResumeInput): Promise<TailorResumeResult> {
  const res = await fetch(apiUrl(ENDPOINTS.resumeTailor), {
    method: 'POST',
    headers: await authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(input),
  });
  return parseJsonOrThrow<TailorResumeResult>(res);
}
