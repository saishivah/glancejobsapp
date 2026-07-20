import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { checkCompaniesV2, classifySponsor, type CompanyV2Result, type SponsorBadge } from '../api/sponsorship';

// Batches a sponsor-status lookup for every distinct company name currently
// loaded in the tracker, so board/list cards can render a badge without a
// per-card network call.
export function useSponsorStatus(companyNames: string[]): UseQueryResult<Map<string, SponsorBadge>, Error> {
  const distinct = Array.from(new Set(companyNames)).sort();

  return useQuery<Map<string, SponsorBadge>, Error>({
    queryKey: ['sponsorStatus', distinct],
    queryFn: async () => {
      const results = await checkCompaniesV2(distinct);
      const byName = new Map<string, CompanyV2Result>(results.map((r) => [r.companyName, r]));
      return new Map(distinct.map((name) => [name, classifySponsor(byName.get(name))]));
    },
    enabled: distinct.length > 0,
    staleTime: 5 * 60_000,
  });
}
