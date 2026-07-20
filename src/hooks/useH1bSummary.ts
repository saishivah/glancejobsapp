import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getH1bSummary, type H1bSummary } from '../api/sponsorship';

// Fetches H1B filings/approval-rate summary for the detail drawer. Disabled
// until the drawer is actually open for a given company.
export function useH1bSummary(companyName: string | null): UseQueryResult<H1bSummary | null, Error> {
  return useQuery<H1bSummary | null, Error>({
    queryKey: ['h1bSummary', companyName],
    queryFn: ({ signal }) => getH1bSummary(companyName as string, signal),
    enabled: companyName !== null,
    staleTime: 5 * 60_000,
    retry: false,
  });
}
