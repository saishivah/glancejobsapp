import { useMemo, useState } from 'react';
import { useAuth, signInWithGoogle } from '../lib/auth';
import { isFirebaseConfigured } from '../lib/firebase';
import { relativeDate } from '../lib/relativeDate';
import { AppShell } from '../components/AppShell';
import { SponsorBadge } from '../components/SponsorBadge';
import { StatusSelect, STATUSES } from '../components/StatusSelect';
import { BoardViewIcon, CloseIcon, ListViewIcon, LocationIcon, PlusIcon, SearchIcon } from '../components/icons';
import { useAddSavedJob, useRemoveSavedJob, useSavedJobs, useUpdateSavedJobStatus } from '../hooks/useSavedJobs';
import { useSponsorStatus } from '../hooks/useSponsorStatus';
import { useH1bSummary } from '../hooks/useH1bSummary';
import type { SavedJob, SavedJobStatus } from '../types/savedJob';
import type { SponsorBadge as SponsorBadgeValue } from '../api/sponsorship';

type SponsorFilter = 'all' | SponsorBadgeValue;
type ViewMode = 'board' | 'list';

export default function Tracker() {
  const { user, status } = useAuth();

  return (
    <AppShell user={user}>
      {status === 'loading' ? (
        <div className="jt-loading-state">Loading…</div>
      ) : status === 'signed-in' ? (
        <TrackerBoard />
      ) : (
        <SignInGate configured={isFirebaseConfigured} />
      )}
    </AppShell>
  );
}

function SignInGate({ configured }: { configured: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
      setBusy(false);
    }
  };

  return (
    <div className="jt-signin-gate">
      <div className="jt-signin-card">
        <h1 className="gj-h3">Track jobs you're applying to</h1>
        {!configured ? (
          <p>Firebase isn't configured for this environment.</p>
        ) : (
          <>
            <p>Sign in to save jobs, track their status, and see sponsorship data for each company.</p>
            <button type="button" className="gj-btn gj-btn-primary" onClick={() => void handleGoogle()} disabled={busy}>
              {busy ? 'Opening Google…' : 'Continue with Google'}
            </button>
            {error ? <p className="jt-modal-error">{error}</p> : null}
          </>
        )}
      </div>
    </div>
  );
}

function TrackerBoard() {
  const jobsQuery = useSavedJobs(true);
  const jobs = useMemo(() => jobsQuery.data ?? [], [jobsQuery.data]);

  const companyNames = useMemo(() => jobs.map((j) => j.companyName), [jobs]);
  const sponsorQuery = useSponsorStatus(companyNames);
  const sponsorMap = sponsorQuery.data;

  const addMutation = useAddSavedJob();
  const updateStatusMutation = useUpdateSavedJobStatus();
  const removeMutation = useRemoveSavedJob();

  const [search, setSearch] = useState('');
  const [sponsorFilter, setSponsorFilter] = useState<SponsorFilter>('all');
  const [view, setView] = useState<ViewMode>('list');
  const [detailId, setDetailId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesQ = !q || job.jobName.toLowerCase().includes(q) || job.companyName.toLowerCase().includes(q);
      const matchesSponsor = sponsorFilter === 'all' || (sponsorMap?.get(job.companyName) ?? 'unknown') === sponsorFilter;
      return matchesQ && matchesSponsor;
    });
  }, [jobs, search, sponsorFilter, sponsorMap]);

  const columns = useMemo(
    () =>
      STATUSES.map((s) => ({
        ...s,
        jobs: filteredJobs.filter((j) => j.status === s.key),
      })),
    [filteredJobs],
  );

  const stats = useMemo(
    () => ({
      total: jobs.length,
      sponsors: jobs.filter((j) => sponsorMap?.get(j.companyName) === 'sponsors').length,
      inProgress: jobs.filter((j) => j.status === 'applied' || j.status === 'interviewing').length,
      offers: jobs.filter((j) => j.status === 'offer').length,
    }),
    [jobs, sponsorMap],
  );

  const drawerJob = detailId !== null ? jobs.find((j) => j.id === detailId) ?? null : null;

  const handleStatusChange = (job: SavedJob, next: SavedJobStatus) => {
    updateStatusMutation.mutate({ id: job.id, status: next });
  };

  const handleRemove = (job: SavedJob) => {
    removeMutation.mutate(job.id);
    if (detailId === job.id) setDetailId(null);
  };

  if (jobsQuery.isLoading) {
    return <div className="jt-loading-state">Loading your saved jobs…</div>;
  }

  if (jobsQuery.isError) {
    return <div className="jt-loading-state">Couldn't load your saved jobs. Try refreshing.</div>;
  }

  return (
    <>
      <header className="jt-header">
        <div className="jt-header-row">
          <div>
            <div className="jt-eyebrow">Job tracker</div>
            <h1 className="jt-title">Your saved jobs</h1>
          </div>
          <button type="button" className="gj-btn gj-btn-primary" onClick={() => setShowAddModal(true)}>
            <PlusIcon />
            Add job
          </button>
        </div>

        <div className="jt-stats">
          <div className="jt-stat">
            <div className="jt-stat-value">{stats.total}</div>
            <div className="jt-stat-label">Total saved</div>
          </div>
          <div className="jt-stat">
            <div className="jt-stat-value jt-stat-value-sponsors">{stats.sponsors}</div>
            <div className="jt-stat-label">Confirmed sponsors</div>
          </div>
          <div className="jt-stat">
            <div className="jt-stat-value">{stats.inProgress}</div>
            <div className="jt-stat-label">In progress</div>
          </div>
          <div className="jt-stat">
            <div className="jt-stat-value jt-stat-value-offers">{stats.offers}</div>
            <div className="jt-stat-label">Offers</div>
          </div>
        </div>

        <div className="jt-toolbar">
          <div className="jt-search">
            <SearchIcon />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title or company"
            />
          </div>

          <div className="jt-chips">
            <button
              type="button"
              className={sponsorFilter === 'all' ? 'jt-chip jt-chip-active' : 'jt-chip'}
              onClick={() => setSponsorFilter('all')}
            >
              All
            </button>
            <button
              type="button"
              className={sponsorFilter === 'sponsors' ? 'jt-chip jt-chip-active' : 'jt-chip'}
              onClick={() => setSponsorFilter('sponsors')}
            >
              Sponsors
            </button>
            <button
              type="button"
              className={sponsorFilter === 'unknown' ? 'jt-chip jt-chip-active' : 'jt-chip'}
              onClick={() => setSponsorFilter('unknown')}
            >
              Unknown
            </button>
          </div>

          <div className="jt-toolbar-spacer" />

          <div className="jt-view-toggle">
            <button
              type="button"
              className={view === 'board' ? 'jt-view-btn jt-view-btn-active' : 'jt-view-btn'}
              onClick={() => setView('board')}
            >
              <BoardViewIcon />
              Board
            </button>
            <button
              type="button"
              className={view === 'list' ? 'jt-view-btn jt-view-btn-active' : 'jt-view-btn'}
              onClick={() => setView('list')}
            >
              <ListViewIcon />
              List
            </button>
          </div>
        </div>
      </header>

      {jobs.length === 0 ? (
        <div className="jt-empty-state">
          <p>No saved jobs yet.</p>
          <button type="button" className="gj-btn gj-btn-secondary" onClick={() => setShowAddModal(true)}>
            Add your first job
          </button>
        </div>
      ) : view === 'board' ? (
        <BoardView
          columns={columns}
          sponsorMap={sponsorMap}
          sponsorLoading={sponsorQuery.isLoading}
          onOpenDetail={setDetailId}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <ListView
          jobs={filteredJobs}
          sponsorMap={sponsorMap}
          sponsorLoading={sponsorQuery.isLoading}
          onOpenDetail={setDetailId}
          onStatusChange={handleStatusChange}
        />
      )}

      {drawerJob ? (
        <DetailDrawer
          job={drawerJob}
          sponsorValue={sponsorMap?.get(drawerJob.companyName)}
          onClose={() => setDetailId(null)}
          onStatusChange={(next) => handleStatusChange(drawerJob, next)}
          onRemove={() => handleRemove(drawerJob)}
        />
      ) : null}

      {showAddModal ? (
        <AddJobModal
          onClose={() => setShowAddModal(false)}
          onSubmit={async (input) => {
            await addMutation.mutateAsync(input);
            setShowAddModal(false);
          }}
        />
      ) : null}
    </>
  );
}

interface BoardListProps {
  sponsorMap: Map<string, SponsorBadgeValue> | undefined;
  sponsorLoading: boolean;
  onOpenDetail: (id: number) => void;
  onStatusChange: (job: SavedJob, status: SavedJobStatus) => void;
}

function BoardView({
  columns,
  sponsorMap,
  sponsorLoading,
  onOpenDetail,
  onStatusChange,
}: BoardListProps & { columns: { key: SavedJobStatus; label: string; jobs: SavedJob[] }[] }) {
  return (
    <div className="jt-board">
      <div className="jt-board-columns">
        {columns.map((col) => (
          <div className="jt-column" key={col.key}>
            <div className="jt-column-header">
              <span className="jt-column-label">{col.label}</span>
              <span className="jt-column-count">{col.jobs.length}</span>
            </div>
            <div className="jt-column-cards">
              {col.jobs.map((job) => (
                <div className="jt-card" key={job.id} onClick={() => onOpenDetail(job.id)}>
                  <div className="jt-card-title">{job.jobName}</div>
                  <div className="jt-card-company">{job.companyName}</div>
                  {job.location ? (
                    <div className="jt-card-location">
                      <LocationIcon />
                      {job.location}
                    </div>
                  ) : null}
                  <div className="jt-card-badge-row">
                    <SponsorBadge value={sponsorMap?.get(job.companyName)} loading={sponsorLoading} />
                  </div>
                  <div className="jt-card-footer">
                    <span className="jt-card-date">{relativeDate(job.dateSaved)}</span>
                    <StatusSelect
                      status={job.status}
                      onChange={(next) => onStatusChange(job, next)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              ))}
              {col.jobs.length === 0 ? <div className="jt-empty-column">No jobs here yet.</div> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ListView({ jobs, sponsorMap, sponsorLoading, onOpenDetail, onStatusChange }: BoardListProps & { jobs: SavedJob[] }) {
  return (
    <div className="jt-list">
      <div className="jt-list-table">
        <div className="jt-list-head">
          <span>Role</span>
          <span>Sponsor</span>
          <span>Status</span>
          <span>Saved</span>
          <span />
        </div>
        {jobs.map((job) => (
          <div className="jt-list-row" key={job.id} onClick={() => onOpenDetail(job.id)}>
            <div>
              <div className="jt-list-role-title">{job.jobName}</div>
              <div className="jt-list-role-sub">
                {job.companyName}
                {job.location ? ` · ${job.location}` : ''}
              </div>
            </div>
            <SponsorBadge value={sponsorMap?.get(job.companyName)} loading={sponsorLoading} />
            <StatusSelect status={job.status} onChange={(next) => onStatusChange(job, next)} onClick={(e) => e.stopPropagation()} />
            <span className="jt-list-date">{relativeDate(job.dateSaved)}</span>
            <span />
          </div>
        ))}
      </div>
    </div>
  );
}

interface DetailDrawerProps {
  job: SavedJob;
  sponsorValue: SponsorBadgeValue | undefined;
  onClose: () => void;
  onStatusChange: (status: SavedJobStatus) => void;
  onRemove: () => void;
}

function DetailDrawer({ job, sponsorValue, onClose, onStatusChange, onRemove }: DetailDrawerProps) {
  const h1bQuery = useH1bSummary(job.companyName);

  return (
    <>
      <div className="jt-drawer-backdrop" onClick={onClose} />
      <div className="jt-drawer">
        <div className="jt-drawer-header">
          <div className="jt-drawer-brand">GlanceJobs</div>
          <button type="button" className="jt-drawer-close" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="jt-drawer-title">{job.jobName}</div>
        <div className="jt-drawer-sub">
          {job.companyName}
          {job.location ? ` · ${job.location}` : ''}
        </div>

        <div className="jt-drawer-badge-row">
          <SponsorBadge value={sponsorValue} loading={h1bQuery.isLoading} />
        </div>

        <div className="jt-drawer-stats">
          <div>
            <div className="jt-drawer-stat-value">{h1bQuery.isLoading ? '—' : (h1bQuery.data?.lcaFiled ?? '—')}</div>
            <div className="jt-drawer-stat-label">H1B filings</div>
          </div>
          <div>
            <div className="jt-drawer-stat-value">
              {h1bQuery.isLoading ? '—' : h1bQuery.data ? `${h1bQuery.data.approvalRatePct}%` : '—'}
            </div>
            <div className="jt-drawer-stat-label">Approval rate</div>
          </div>
          <div>
            <div className="jt-drawer-stat-value">—</div>
            <div className="jt-drawer-stat-label">Est. salary</div>
          </div>
        </div>

        <div className="jt-drawer-field">
          <label htmlFor="drawer-status">Status</label>
          <select
            id="drawer-status"
            className="jt-drawer-select"
            value={job.status}
            onChange={(e) => onStatusChange(e.target.value as SavedJobStatus)}
          >
            {STATUSES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="jt-drawer-actions">
          <a
            className="jt-drawer-open-link"
            href={job.jobUrl || undefined}
            aria-disabled={!job.jobUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open listing
          </a>
          <button type="button" className="jt-drawer-remove-btn" onClick={onRemove}>
            Remove
          </button>
        </div>

        <div className="jt-drawer-footnote">Sponsorship data based on USCIS disclosure records.</div>
      </div>
    </>
  );
}

interface AddJobModalProps {
  onClose: () => void;
  onSubmit: (input: { companyName: string; jobName: string; location?: string; jobUrl?: string }) => Promise<void>;
}

function AddJobModal({ onClose, onSubmit }: AddJobModalProps) {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !company.trim()) {
      setError('Job title and company are required.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await onSubmit({
        jobName: title.trim(),
        companyName: company.trim(),
        location: location.trim() || undefined,
        jobUrl: url.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this job.');
      setBusy(false);
    }
  };

  return (
    <>
      <div className="jt-modal-backdrop" onClick={onClose} />
      <div className="jt-modal">
        <div className="jt-modal-title">Add a job manually</div>
        <div className="jt-modal-fields">
          <div className="jt-modal-field">
            <label htmlFor="add-title">Job title</label>
            <input
              id="add-title"
              className="gj-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Senior Frontend Engineer"
            />
          </div>
          <div className="jt-modal-row">
            <div className="jt-modal-field">
              <label htmlFor="add-company">Company</label>
              <input
                id="add-company"
                className="gj-input"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Lumen"
              />
            </div>
            <div className="jt-modal-field">
              <label htmlFor="add-location">Location</label>
              <input
                id="add-location"
                className="gj-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Remote"
              />
            </div>
          </div>
          <div className="jt-modal-field">
            <label htmlFor="add-url">Listing URL</label>
            <input
              id="add-url"
              className="gj-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://linkedin.com/jobs/view/…"
            />
          </div>
        </div>

        {error ? <p className="jt-modal-error">{error}</p> : null}

        <div className="jt-modal-actions">
          <button type="button" className="gj-btn gj-btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="gj-btn gj-btn-primary" onClick={() => void handleSubmit()} disabled={busy}>
            {busy ? 'Saving…' : 'Save job'}
          </button>
        </div>
      </div>
    </>
  );
}
