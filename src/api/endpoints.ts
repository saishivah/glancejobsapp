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
} as const;

export type EndpointPath = (typeof ENDPOINTS)[keyof typeof ENDPOINTS];

// Builds an absolute URL for an endpoint path against the configured BASE_URL.
export function apiUrl(path: string): string {
  return `${BASE_URL}${path}`;
}
