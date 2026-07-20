import { getIdTokenOrThrow, parseJsonOrThrow } from './client';
import { ENDPOINTS, apiUrl } from './endpoints';
import type { SavedJob, SavedJobStatus } from '../types/savedJob';

// Typed wrappers around javascript-glancejobs' SavedJobController
// (src/controllers/SavedJobController.ts). All routes require a signed-in
// user — userId is derived server-side from the Firebase token, never sent
// by the client.

async function authHeaders(extra?: Record<string, string>): Promise<HeadersInit> {
  const token = await getIdTokenOrThrow();
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}

export async function listSavedJobs(signal?: AbortSignal): Promise<SavedJob[]> {
  const res = await fetch(`${apiUrl(ENDPOINTS.savedJobs)}/`, {
    method: 'GET',
    headers: await authHeaders(),
    signal,
  });
  return parseJsonOrThrow<SavedJob[]>(res);
}

export interface AddSavedJobInput {
  companyName: string;
  jobName: string;
  jobId?: string;
  location?: string;
  jobUrl?: string;
}

export async function addSavedJob(input: AddSavedJobInput): Promise<SavedJob> {
  const res = await fetch(`${apiUrl(ENDPOINTS.savedJobs)}/`, {
    method: 'POST',
    headers: await authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(input),
  });
  return parseJsonOrThrow<SavedJob>(res);
}

export async function updateSavedJobStatus(id: number, status: SavedJobStatus): Promise<{ id: number; status: SavedJobStatus }> {
  const res = await fetch(`${apiUrl(ENDPOINTS.savedJobs)}/${id}/status`, {
    method: 'PATCH',
    headers: await authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ status }),
  });
  return parseJsonOrThrow<{ id: number; status: SavedJobStatus }>(res);
}

export async function removeSavedJob(id: number): Promise<{ message: string }> {
  const res = await fetch(`${apiUrl(ENDPOINTS.savedJobs)}/${id}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  return parseJsonOrThrow<{ message: string }>(res);
}
