import type { MouseEvent } from 'react';
import type { SavedJobStatus } from '../types/savedJob';

export const STATUSES: { key: SavedJobStatus; label: string }[] = [
  { key: 'saved', label: 'Saved' },
  { key: 'applied', label: 'Applied' },
  { key: 'interviewing', label: 'Interviewing' },
  { key: 'offer', label: 'Offer' },
  { key: 'rejected', label: 'Rejected' },
];

interface StatusSelectProps {
  status: SavedJobStatus;
  onChange: (status: SavedJobStatus) => void;
  size?: 'sm' | 'lg';
  onClick?: (e: MouseEvent) => void;
}

export function StatusSelect({ status, onChange, size = 'sm', onClick }: StatusSelectProps) {
  return (
    <select
      className={size === 'lg' ? 'jt-status-select jt-status-select-lg' : 'jt-status-select'}
      value={status}
      onClick={onClick}
      onChange={(e) => onChange(e.target.value as SavedJobStatus)}
    >
      {STATUSES.map((s) => (
        <option key={s.key} value={s.key}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
