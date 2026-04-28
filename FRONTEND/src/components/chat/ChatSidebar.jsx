import React, { useMemo, useState } from 'react';
import './ChatSidebar.css';

function formatLastActivity(value) {
  if (!value) {
    return 'Recent conversation';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Recent conversation';
  }

  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
  }).format(date);
}

const ChatSidebar = ({
  chats,
  activeChatId,
  activePanel,
  currentUser,
  onSelectChat,
  onNewChat,
  onOpenSettings,
  onSwitchAccount,
  onDeleteChat,
  deletingChatId,
  open,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return chats;
    }

    return chats.filter((chat) => chat.title?.toLowerCase().includes(normalizedQuery));
  }, [chats, searchQuery]);

  const displayName = currentUser?.fullName
    ? `${currentUser.fullName.firstName || ''} ${currentUser.fullName.lastName || ''}`.trim()
    : 'Mate.ai User';
  const accountEmail = currentUser?.email || 'Guest session';

  return (
    <aside className={`chat-sidebar ${open ? 'open' : ''}`} aria-label="Conversation history">
      <div className="chat-sidebar-top">
        <div className="chat-sidebar-header">
          <div className="chat-sidebar-brand">
            <div className="chat-sidebar-logo">M</div>
            <div>
              <strong>Mate.ai</strong>
              <span>Your workspace</span>
            </div>
          </div>

          <button
            type="button"
            className="chat-sidebar-close"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            x
          </button>
        </div>

        <div className="chat-sidebar-actions">
          <button type="button" className="chat-sidebar-new" onClick={onNewChat}>
            + New chat
          </button>
          <button
            type="button"
            className={`chat-sidebar-secondary ${activePanel === 'settings' ? 'is-active' : ''}`}
            onClick={onOpenSettings}
          >
            Settings
          </button>
        </div>

        <div className="chat-sidebar-search">
          <input
            type="text"
            placeholder="Search chats"
            aria-label="Search chats"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
      </div>

      <div className="chat-sidebar-history">
        <div className="chat-sidebar-section-heading">
          <p className="chat-sidebar-label">Chats</p>
          <span>{filteredChats.length}</span>
        </div>

        <nav className="chat-list" aria-live="polite">
          {filteredChats.map((chat) => (
            <div
              key={chat._id}
              className={`chat-list-item ${chat._id === activeChatId ? 'active' : ''}`}
            >
              <button
                type="button"
                className="chat-list-select"
                onClick={() => onSelectChat(chat._id)}
              >
                <span className="chat-list-copy">
                  <span className="title-line">{chat.title}</span>
                  <span className="chat-list-meta">
                    {chat._id === activeChatId
                      ? `Open now - ${formatLastActivity(chat.lastActivity)}`
                      : `Last active - ${formatLastActivity(chat.lastActivity)}`}
                  </span>
                </span>
              </button>

              <div className="chat-list-actions">
                <button
                  type="button"
                  className="chat-delete-btn"
                  aria-label={`Delete ${chat.title}`}
                  disabled={deletingChatId === chat._id}
                  onClick={() => onDeleteChat(chat._id)}
                >
                  {deletingChatId === chat._id ? '...' : 'Del'}
                </button>
              </div>
            </div>
          ))}

          {filteredChats.length === 0 && searchQuery.trim() && (
            <div className="empty-hint">
              <strong>No matching chats</strong>
              <span>Try a different search or start a new conversation.</span>
            </div>
          )}

          {chats.length === 0 && !searchQuery.trim() && (
            <div className="empty-hint">
              <strong>No chats yet</strong>
              <span>Your previous conversations will appear here.</span>
            </div>
          )}
        </nav>
      </div>

      <div className="chat-sidebar-bottom">
        <div className="chat-sidebar-profile">
          <div className="chat-sidebar-avatar">M</div>
          <div className="chat-sidebar-profile-copy">
            <strong>{displayName}</strong>
            <span>{accountEmail}</span>
            <span>{activePanel === 'settings' ? 'Settings open' : 'Chat ready'}</span>
          </div>
          <button type="button" className="chat-sidebar-switch-btn" onClick={onSwitchAccount}>
            Switch
          </button>
        </div>
      </div>
    </aside>
  );
};

export default ChatSidebar;
