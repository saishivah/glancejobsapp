import type { SponsorBadge as SponsorBadgeValue } from '../api/sponsorship';

interface SponsorBadgeProps {
  value: SponsorBadgeValue | undefined;
  loading?: boolean;
}

export function SponsorBadge({ value, loading }: SponsorBadgeProps) {
  if (loading || !value) {
    return (
      <span className="gj-badge gj-badge-unknown gj-badge-dot">
        Checking…
      </span>
    );
  }
  if (value === 'sponsors') {
    return (
      <span className="gj-badge gj-badge-sponsors gj-badge-dot">
        Sponsors OPT
      </span>
    );
  }
  return (
    <span className="gj-badge gj-badge-unknown gj-badge-dot">
      No data yet
    </span>
  );
}
