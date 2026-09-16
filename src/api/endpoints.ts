import { BASE_URL } from './client';

// Central registry of every backend API endpoint path. Callers should
// reference these constants (or apiUrl()) instead of inlining URL strings.
export const ENDPOINTS = {
  // GET/POST — saved jobs list + create (Firebase-authenticated)
  savedJobs: '/saved-jobs',
  // GET — live H1B report for a company by name (Firebase-authenticated)
  h1bCompanyData: '/h1b/company/getH1bdata',
  // POST — batch OPT/H1B sponsor check by company name (no auth required)
  checkCompaniesV2: '/extension/check-companies-v2',
  // GET/POST — the user's saved root resume (Firebase-authenticated)
  resumeRoot: '/api/resume',
  // GET — today/this-month tailor usage counters (Firebase-authenticated)
  resumeUsage: '/api/resume/usage',
  // GET — list of past tailored variants; GET :id for one variant's full text
  resumeHistory: '/api/resume/history',
  // POST — generate a tailored resume for a job description
  resumeTailor: '/api/resume/tailor',
} as const;

export type EndpointPath = (typeof ENDPOINTS)[keyof typeof ENDPOINTS];

// Builds an absolute URL for an endpoint path against the configured BASE_URL.
export function apiUrl(path: string): string {
  return `${BASE_URL}${path}`;
}
