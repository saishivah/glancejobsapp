import { getIdTokenOrThrow, parseJsonOrThrow } from './client';
import { ENDPOINTS, apiUrl } from './endpoints';

// --- Sponsor badge (Sponsors / Unknown) --------------------------------
// POST /extension/check-companies-v2 — no auth required. Only returns
// booleans (found in the OPT/H1B index or not), so we can't reliably tell
// "confirmed non-sponsor" from "no data at all" — treat it as binary
// confidence: found → Sponsors, otherwise → Unknown. See ExtensionController
// (javascript-glancejobs) for the source of truth.

export interface H1BStatus {
  lastFive: boolean;
  lastYear: boolean;
}

export interface CompanyV2Result {
  companyName: string;
  optStatus: boolean;
  h1bStatus: H1BStatus;
}

export async function checkCompaniesV2(companyNames: string[]): Promise<CompanyV2Result[]> {
  if (companyNames.length === 0) return [];
  const res = await fetch(apiUrl(ENDPOINTS.checkCompaniesV2), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ companyNames }),
  });
  return parseJsonOrThrow<CompanyV2Result[]>(res);
}

export type SponsorBadge = 'sponsors' | 'unknown';

export function classifySponsor(result: CompanyV2Result | undefined): SponsorBadge {
  if (!result) return 'unknown';
  return result.optStatus || result.h1bStatus.lastFive ? 'sponsors' : 'unknown';
}

// --- H1B summary stats for the detail drawer ----------------------------
// GET /h1b/company/getH1bdata — Firebase-authenticated. We only need the
// summary totals here (filings + approval rate), not the full year-by-year
// report/chart that <H1BCompanyProfile> renders on the company pages.

export interface H1bSummary {
  lcaFiled: number;
  approvalRatePct: number;
}

export async function getH1bSummary(companyName: string, signal?: AbortSignal): Promise<H1bSummary | null> {
  const token = await getIdTokenOrThrow();
  const qs = new URLSearchParams({ name: companyName });
  const res = await fetch(`${apiUrl(ENDPOINTS.h1bCompanyData)}?${qs.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    signal,
  });
  if (res.status === 404) return null;
  const report = await parseJsonOrThrow<{ totals: { lcaFiled: number; approvalRatePct: number } }>(res);
  return { lcaFiled: report.totals.lcaFiled, approvalRatePct: report.totals.approvalRatePct };
}
