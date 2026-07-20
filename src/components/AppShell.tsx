import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { signOut } from '../lib/auth';
import { CompaniesIcon, GuidesIcon, LogoMark, SettingsIcon, TrackerIcon } from './icons';

const MARKETING_SITE_URL = import.meta.env.VITE_MARKETING_SITE_URL || 'https://glancejobs.com';

interface AppShellProps {
  user: User | null;
  children: ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  const initial = (user?.displayName || user?.email || '?').trim().charAt(0).toUpperCase();

  return (
    <div className="jt-shell">
      <aside className="jt-sidebar">
        <div className="jt-logo">
          <LogoMark />
          <span className="jt-logo-text">
            glance<span className="jt-logo-accent">jobs</span>
          </span>
        </div>

        <nav className="jt-nav">
          <div className="jt-nav-item jt-nav-item-active">
            <TrackerIcon />
            Tracker
          </div>
          <a className="jt-nav-item" href={`${MARKETING_SITE_URL}/sponsorship-search/`}>
            <CompaniesIcon />
            Companies
          </a>
          <div className="jt-nav-item jt-nav-item-disabled" aria-disabled="true">
            <GuidesIcon />
            Guides
            <span className="jt-nav-soon">Soon</span>
          </div>
          <div className="jt-nav-item jt-nav-item-disabled" aria-disabled="true">
            <SettingsIcon />
            Settings
            <span className="jt-nav-soon">Soon</span>
          </div>
        </nav>

        <div className="jt-sidebar-spacer" />

        {user ? (
          <div className="jt-profile">
            <div className="jt-profile-avatar">{initial}</div>
            <div className="jt-profile-meta">
              <div className="jt-profile-name">{user.displayName || user.email}</div>
              <button type="button" className="jt-profile-signout" onClick={() => void signOut()}>
                Sign out
              </button>
            </div>
          </div>
        ) : null}
      </aside>

      <div className="jt-content">{children}</div>
    </div>
  );
}
