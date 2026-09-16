import { forwardRef, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useAuth } from '../lib/auth';
import { isFirebaseConfigured } from '../lib/firebase';
import { relativeDate } from '../lib/relativeDate';
import { ApiError } from '../api/client';
import { AppShell } from '../components/AppShell';
import { SignInGate } from '../components/SignInGate';
import { CheckCircleIcon, ChevronDownIcon, ChevronUpIcon, CopyIcon, DownloadIcon, UploadIcon } from '../components/icons';
import {
  useResumeHistory,
  useResumeHistoryItem,
  useResumeUsage,
  useRootResume,
  useSaveRootResume,
  useTailorResume,
} from '../hooks/useResume';
import type { ResumeHistoryItem } from '../types/resume';

const JD_MAX_LENGTH = 8000;
const CUSTOM_RESUME_MAX_LENGTH = 20000;
const ROOT_RESUME_MAX_LENGTH = 20000;

export default function TailorResumePage() {
  const { user, status } = useAuth();

  return (
    <AppShell user={user}>
      {status === 'loading' ? (
        <div className="jt-loading-state">Loading…</div>
      ) : status === 'signed-in' ? (
        <TailorResumeBoard />
      ) : (
        <SignInGate
          configured={isFirebaseConfigured}
          title="Tailor your resume to a job"
          description="Sign in to save a base resume and generate a version tailored to each job description."
        />
      )}
    </AppShell>
  );
}

function TailorResumeBoard() {
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  const [customExpanded, setCustomExpanded] = useState(false);
  const [customResumeText, setCustomResumeText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [generateError, setGenerateError] = useState<string | null>(null);
  const [tailoredResume, setTailoredResume] = useState('');
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');
  const rootResumeCardRef = useRef<HTMLDivElement>(null);

  const rootResumeQuery = useRootResume(true);
  const usageQuery = useResumeUsage(true);
  const historyQuery = useResumeHistory(true);

  const saveRootResumeMutation = useSaveRootResume();
  const tailorMutation = useTailorResume();
  const historyItemMutation = useResumeHistoryItem();

  const rootResumeMissing = rootResumeQuery.error instanceof ApiError && rootResumeQuery.error.status === 404;

  const jdLength = jobDescription.length;
  const jdOverLimit = jdLength > JD_MAX_LENGTH;
  const jdEmpty = jobDescription.trim().length === 0;
  const customLength = customResumeText.length;
  const customOverLimit = customLength > CUSTOM_RESUME_MAX_LENGTH;

  const generateDisabled = jdEmpty || jdOverLimit || (customExpanded && customOverLimit) || tailorMutation.isPending;

  const handleGenerate = async () => {
    if (tailorMutation.isPending) return;
    const trimmedJD = jobDescription.trim();
    if (!trimmedJD || trimmedJD.length > JD_MAX_LENGTH) return;
    if (customExpanded && customOverLimit) return;

    setGenerateError(null);

    const trimmedTitle = jobTitle.trim();
    const trimmedCustomResume = customExpanded ? customResumeText.trim() : '';

    try {
      const result = await tailorMutation.mutateAsync({
        jobDescription: trimmedJD,
        ...(trimmedTitle ? { jobId: trimmedTitle } : {}),
        ...(trimmedCustomResume ? { resumeText: trimmedCustomResume } : {}),
      });
      setTailoredResume(result.tailoredResume);
      setActiveHistoryId(null);
    } catch (err) {
      const status = err instanceof ApiError ? err.status : undefined;
      if (status === 404) {
        setGenerateError(
          'No resume on file yet — save one below before tailoring, or expand "Use a different resume for this generation" to provide one for this generation only.',
        );
        rootResumeCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (status === 429) {
        setGenerateError('Daily limit reached — try again tomorrow.');
      } else if (status === 402) {
        setGenerateError('Monthly limit reached — resets next month.');
      } else {
        setGenerateError('Something went wrong generating your resume. Please try again.');
      }
    }
  };

  const handleSelectHistory = async (item: ResumeHistoryItem) => {
    setGenerateError(null);
    try {
      const detail = await historyItemMutation.mutateAsync(item.id);
      setTailoredResume(detail.tailoredResume);
      setActiveHistoryId(item.id);
    } catch {
      setGenerateError("Couldn't load that resume variant. Please try again.");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tailoredResume);
      setCopyFeedback('Copied to clipboard');
    } catch {
      setCopyFeedback("Couldn't copy — please copy manually");
    }
    window.setTimeout(() => setCopyFeedback(''), 3000);
  };

  const handleDownload = () => {
    const blob = new Blob([tailoredResume], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const safeName =
      jobTitle
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'tailored-resume';
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCustomResumeText(String(reader.result || ''));
    reader.readAsText(file);
  };

  const history = historyQuery.data ?? [];
  const usage = usageQuery.data;

  return (
    <div className="rt-page">
      <header className="jt-header">
        <div className="jt-header-row">
          <div>
            <div className="jt-eyebrow">Tailor resume</div>
            <h1 className="jt-title">Tailor Resume</h1>
          </div>
        </div>
        <p className="rt-subtitle">Paste a job description to generate a resume tailored to it.</p>
      </header>

      <div className="rt-body">
        <RootResumeCard
          ref={rootResumeCardRef}
          query={rootResumeQuery}
          missing={rootResumeMissing}
          onSave={(text) => saveRootResumeMutation.mutateAsync(text)}
          saving={saveRootResumeMutation.isPending}
        />

        <div className="rt-columns">
          <section className="rt-panel">
            <h2 className="rt-panel-title">Job details</h2>

            {rootResumeMissing && !customExpanded ? (
              <div className="rt-notice">
                You don't have a saved resume yet. Save one above, or use "Use a different resume for this
                generation" below.
              </div>
            ) : null}

            <div className="gj-field">
              <label className="gj-label" htmlFor="job-title">
                Job Title
              </label>
              <input
                id="job-title"
                className="gj-input"
                placeholder="e.g. Senior Backend Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>

            <div className="gj-field rt-field-spaced">
              <label className="gj-label" htmlFor="job-description">
                Job Description *
              </label>
              <textarea
                id="job-description"
                className="gj-textarea"
                rows={10}
                style={{ resize: 'vertical' }}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
              <div className="rt-counter-row">
                <span className={jdOverLimit ? 'rt-counter rt-counter-error' : 'rt-counter'} aria-live="polite">
                  {jdLength} / {JD_MAX_LENGTH}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="rt-disclosure"
              onClick={() => setCustomExpanded((v) => !v)}
              aria-expanded={customExpanded}
              aria-controls="custom-resume-section"
            >
              {customExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
              Use a different resume for this generation
            </button>

            {customExpanded ? (
              <div id="custom-resume-section" className="rt-custom-resume">
                <div className="rt-upload-row">
                  <button
                    type="button"
                    className="gj-btn gj-btn-secondary gj-btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadIcon />
                    Upload .txt
                  </button>
                  <input ref={fileInputRef} type="file" accept=".txt" hidden onChange={handleFileUpload} />
                </div>
                <div className="gj-field">
                  <label className="gj-label" htmlFor="custom-resume-text">
                    One-off resume text
                  </label>
                  <textarea
                    id="custom-resume-text"
                    className="gj-textarea"
                    rows={6}
                    style={{ resize: 'vertical' }}
                    placeholder="Paste a resume to use for just this generation"
                    value={customResumeText}
                    onChange={(e) => setCustomResumeText(e.target.value)}
                  />
                </div>
                <div className="rt-counter-row">
                  <span className={customOverLimit ? 'rt-counter rt-counter-error' : 'rt-counter'} aria-live="polite">
                    {customLength} / {CUSTOM_RESUME_MAX_LENGTH}
                  </span>
                </div>
                <p className="gj-caption rt-custom-caption">
                  This resume is used for this generation only — your saved resume won't be changed.
                </p>
              </div>
            ) : null}

            <button
              type="button"
              className="gj-btn gj-btn-primary rt-generate-btn"
              disabled={generateDisabled}
              onClick={() => void handleGenerate()}
            >
              {tailorMutation.isPending ? 'Tailoring…' : 'Generate'}
            </button>

            {generateError ? (
              <p className="jt-modal-error" role="alert">
                {generateError}
              </p>
            ) : null}

            <div className="rt-usage-line">
              {usageQuery.isLoading ? (
                <span className="gj-caption">Loading usage…</span>
              ) : usage ? (
                <span className="gj-caption">
                  {usage.daily.used} / {usage.daily.limit} today · {usage.monthly.used} / {usage.monthly.limit} this
                  month
                </span>
              ) : (
                <span className="gj-caption">Usage unavailable.</span>
              )}
            </div>
          </section>

          <section className="rt-panel rt-preview-panel">
            <div className="rt-preview-header">
              <h2 className="rt-panel-title">Preview</h2>
              {tailoredResume ? (
                <div className="rt-preview-actions">
                  <button type="button" className="gj-btn gj-btn-secondary gj-btn-sm" onClick={() => void handleCopy()}>
                    <CopyIcon />
                    Copy
                  </button>
                  <button type="button" className="gj-btn gj-btn-secondary gj-btn-sm" onClick={handleDownload}>
                    <DownloadIcon />
                    Download
                  </button>
                </div>
              ) : null}
            </div>

            {activeHistoryId ? <span className="gj-badge rt-history-chip">Viewing a saved variant</span> : null}

            {tailoredResume ? (
              <pre className="rt-preview-box" role="textbox" aria-readonly="true" aria-label="Tailored resume preview" tabIndex={0}>
                {tailoredResume}
              </pre>
            ) : (
              <div className="rt-preview-empty">
                <p>Your tailored resume will appear here after you generate one.</p>
              </div>
            )}

            <hr className="gj-hr" />

            <button
              type="button"
              className="rt-history-toggle"
              onClick={() => setHistoryOpen((v) => !v)}
              aria-expanded={historyOpen}
              aria-controls="resume-history-list"
            >
              <span>History {history.length > 0 ? `(${history.length})` : ''}</span>
              {historyOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </button>

            {historyOpen ? (
              <div id="resume-history-list" className="rt-history-list">
                {historyQuery.isLoading ? (
                  <p className="gj-caption">Loading history…</p>
                ) : history.length === 0 ? (
                  <p className="gj-caption">No previous generations yet.</p>
                ) : (
                  history.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={activeHistoryId === item.id ? 'rt-history-row rt-history-row-active' : 'rt-history-row'}
                      onClick={() => void handleSelectHistory(item)}
                      disabled={historyItemMutation.isPending}
                    >
                      <span className="rt-history-row-title">{item.jobId || 'Untitled'}</span>
                      <span className="rt-history-row-date">{relativeDate(item.createdAt)}</span>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </section>
        </div>
      </div>

      {copyFeedback ? (
        <div className="rt-toast" role="status">
          {copyFeedback}
        </div>
      ) : null}
    </div>
  );
}

interface RootResumeCardProps {
  query: ReturnType<typeof useRootResume>;
  missing: boolean;
  saving: boolean;
  onSave: (text: string) => Promise<unknown>;
}

const RootResumeCard = forwardRef<HTMLDivElement, RootResumeCardProps>(function RootResumeCard(
  { query, missing, saving, onSave },
  ref,
) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (query.isSuccess) setDraft(query.data.resumeText || '');
  }, [query.isSuccess, query.data]);

  useEffect(() => {
    if (missing) setEditing(true);
  }, [missing]);

  const isValid = draft.trim().length > 0 && draft.length <= ROOT_RESUME_MAX_LENGTH;

  const handleSave = async () => {
    if (!isValid || saving) return;
    setSaveError(null);
    try {
      await onSave(draft.trim());
      setEditing(false);
    } catch {
      setSaveError("Couldn't save your resume. Please try again.");
    }
  };

  const loadFailed = query.isError && !missing;

  return (
    <div ref={ref} className="rt-card">
      {query.isLoading ? (
        <p className="gj-caption">Checking for a saved resume…</p>
      ) : loadFailed && !editing ? (
        <div className="rt-card-row">
          <span className="gj-caption">Couldn't check your saved resume.</span>
          <button type="button" className="gj-btn gj-btn-ghost gj-btn-sm" onClick={() => void query.refetch()}>
            Try again
          </button>
        </div>
      ) : !editing ? (
        <div className="rt-card-row">
          <span className="rt-card-status">
            <CheckCircleIcon />
            Resume on file
          </span>
          <button type="button" className="gj-btn gj-btn-ghost gj-btn-sm" onClick={() => setEditing(true)}>
            Replace
          </button>
        </div>
      ) : (
        <div>
          <h3 className="rt-card-title">{query.isSuccess ? 'Replace your saved resume' : 'Paste your resume'}</h3>
          <p className="gj-caption rt-card-desc">
            This is the resume used to generate tailored variants, unless you provide a one-off resume for a specific
            generation below.
          </p>
          <textarea
            id="root-resume-text"
            className="gj-textarea"
            rows={8}
            style={{ resize: 'vertical' }}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="rt-counter-row">
            <span className={draft.length > ROOT_RESUME_MAX_LENGTH ? 'rt-counter rt-counter-error' : 'rt-counter'} aria-live="polite">
              {draft.length} / {ROOT_RESUME_MAX_LENGTH}
            </span>
            <div className="rt-card-actions">
              {query.isSuccess ? (
                <button type="button" className="gj-btn gj-btn-ghost gj-btn-sm" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              ) : null}
              <button
                type="button"
                className="gj-btn gj-btn-primary gj-btn-sm"
                disabled={!isValid || saving}
                onClick={() => void handleSave()}
              >
                {saving ? 'Saving…' : 'Save resume'}
              </button>
            </div>
          </div>
        </div>
      )}
      {saveError ? (
        <p className="jt-modal-error" role="alert">
          {saveError}
        </p>
      ) : null}
    </div>
  );
});
