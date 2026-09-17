// Types for the resume-tailoring feature (POST /api/resume/tailor and friends).
// Not yet backed by a shared DTO in javascript-glancejobs — keep in sync once one exists.

export interface RootResume {
  resumeText: string;
  updatedAt?: string;
}

export interface ResumeUsageWindow {
  used: number;
  limit: number;
}

export interface ResumeUsage {
  daily: ResumeUsageWindow;
  monthly: ResumeUsageWindow;
}

export interface ResumeHistoryItem {
  id: string;
  jobId?: string;
  createdAt: string;
}

export interface ResumeHistoryDetail extends ResumeHistoryItem {
  tailoredResume: string;
}

export interface TailorResumeInput {
  jobDescription: string;
  jobId?: string;
  resumeText?: string;
}

export interface TailorResumeResult {
  tailoredResume: string;
}
