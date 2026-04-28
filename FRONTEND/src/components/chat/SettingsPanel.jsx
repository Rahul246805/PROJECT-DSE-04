import React from 'react';
import './SettingsPanel.css';

const PREFERENCES = [
  {
    label: 'Workspace mode',
    value: 'Fast and focused',
    description: 'Optimized for day-to-day planning, debugging, and research conversations.',
  },
  {
    label: 'Response style',
    value: 'Clear and practical',
    description: 'Balanced for concise guidance with enough detail to keep momentum.',
  },
  {
    label: 'Session privacy',
    value: 'Protected',
    description: 'Your active workspace uses secure session handling before chat requests are sent.',
  },
];

const SettingsPanel = ({ currentUser, onLogout, onSwitchAccount, isLoggingOut }) => {
  const displayName = currentUser?.fullName
    ? `${currentUser.fullName.firstName || ''} ${currentUser.fullName.lastName || ''}`.trim()
    : 'Mate.ai User';
  const accountEmail = currentUser?.email || 'Guest session';

  return (
    <div className="settings-panel">
      <section className="settings-hero">
        <div>
          <span className="settings-kicker">Workspace settings</span>
          <h2>Control how Mate.ai works for you.</h2>
          <p>
            Review the current workspace behavior, confirm session protections, and sign out when
            you are done.
          </p>
        </div>
        <div className="settings-status-card">
          <span className="settings-status-dot" />
          <div>
            <strong>Session active</strong>
            <p>Your chat workspace is ready and connected.</p>
          </div>
        </div>
      </section>

      <section className="settings-grid" aria-label="Workspace preferences">
        {PREFERENCES.map((item) => (
          <article key={item.label} className="settings-card">
            <p className="settings-card-label">{item.label}</p>
            <strong>{item.value}</strong>
            <p>{item.description}</p>
          </article>
        ))}
      </section>

      <section className="settings-actions">
        <article className="settings-card settings-card-wide">
          <p className="settings-card-label">Account</p>
          <strong>{displayName}</strong>
          <p className="settings-account-email">{accountEmail}</p>
          <p>
            Logging out clears your current local workspace session and returns you to the login
            screen.
          </p>
          <div className="settings-account-actions">
            <button
              type="button"
              className="settings-switch-btn"
              onClick={onSwitchAccount}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Switching...' : 'Switch account'}
            </button>
            <button
              type="button"
              className="settings-logout-btn"
              onClick={onLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Signing out...' : 'Log out'}
            </button>
          </div>
        </article>
      </section>
    </div>
  );
};

export default SettingsPanel;
