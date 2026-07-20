import { getFirebaseAuth } from '../lib/firebase';

// Shared API client primitives used by the typed endpoint modules
// (savedJobs.ts, sponsorship.ts, ...). Keeps base URL, error types, the
// Firebase token helper, and JSON parsing in one place. Ported from
// glancejobsUI/src/api/client.ts to keep the same contract with the backend.

// Override locally via VITE_SEARCH_API_BASE in .env; defaults to prod otherwise.
export const BASE_URL = import.meta.env.VITE_SEARCH_API_BASE || 'https://api.new.glancejobs.com';

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export class NotSignedInError extends Error {
  constructor() {
    super('not signed in');
    this.name = 'NotSignedInError';
  }
}

export async function getIdTokenOrThrow(): Promise<string> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new NotSignedInError();
  return user.getIdToken();
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  const text = await res.text();
  const body: unknown = text ? safeJson(text) : null;
  if (!res.ok) {
    const message =
      (typeof body === 'object' && body !== null && 'message' in body && typeof (body as { message: unknown }).message === 'string'
        ? (body as { message: string }).message
        : typeof body === 'object' && body !== null && 'error' in body && typeof (body as { error: unknown }).error === 'string'
          ? (body as { error: string }).error
          : null) ?? `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message, body);
  }
  return body as T;
}
