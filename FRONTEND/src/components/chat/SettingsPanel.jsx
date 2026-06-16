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

const SettingsPanel = ({
  currentUser,
  onLogout,
  onSwitchAccount,
  isLoggingOut,
  selectedModel,
  providerLabel,
  lastUsage,
}) => {
  const displayName = currentUser?.fullName
    ? `${currentUser.fullName.firstName || ''} ${currentUser.fullName.lastName || ''}`.trim()
    : 'Mate.ai User';
  const accountEmail = currentUser?.email || currentUser?.phoneNumber || 'Secure session';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'M';

  return (
    <div className="settings-panel">
      <section className="settings-hero">
        <div>
          <span className="settings-kicker">Workspace settings</span>
          <h2>Control how Mate.AI works for you.</h2>
          <p>
            Review the current workspace behavior, confirm session protections, and sign out when
            you are done.
          </p>
        </div>
        <div className="settings-status-card">
          <span className="settings-status-dot" />
          <div>
            <strong>Session active</strong>
            <p>Your chat workspace is ready and connected through {providerLabel}.</p>
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
          <p className="settings-card-label">AI engine</p>
          <strong>{selectedModel}</strong>
          <p>
            Groq powers the assistant. Model selection is available directly in the chat composer.
          </p>
          <div className="mt-4 text-sm">
            {lastUsage?.total_tokens
              ? `Last reply token usage: ${lastUsage.total_tokens} total, ${lastUsage.prompt_tokens || 0} prompt, ${lastUsage.completion_tokens || 0} completion`
              : 'No token usage recorded yet for this session.'}
          </div>
        </article>
        <article className="settings-card settings-card-wide">
          <p className="settings-card-label">Account</p>
          <div className="mb-4 flex items-center gap-4">
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={displayName}
                className="h-14 w-14 rounded-full border border-white/10 object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg font-semibold">
                {initials}
              </div>
            )}
            <div>
              <strong>{displayName}</strong>
              <p className="settings-account-email">{accountEmail}</p>
            </div>
          </div>
          <p>
            Logging out ends your active session and returns you to the Mate.AI authentication
            flow.
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
