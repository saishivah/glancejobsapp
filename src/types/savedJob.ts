// Mirrors javascript-glancejobs/src/dto/types.ts — keep in sync with the backend.

export type SavedJobStatus = 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected';

export interface SavedJob {
  id: number;
  userId: string;
  jobId: string;
  companyName: string;
  jobName: string;
  status: SavedJobStatus;
  location?: string;
  jobUrl?: string;
  dateSaved?: string;
}
