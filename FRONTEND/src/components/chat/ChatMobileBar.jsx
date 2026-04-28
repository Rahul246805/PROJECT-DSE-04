import React from 'react';
import './ChatMobileBar.css';

const ChatMobileBar = ({ onToggleSidebar, onNewChat, onOpenCommandPalette, title }) => (
  <header className="chat-mobile-bar">
    <button type="button" className="chat-icon-btn" onClick={onToggleSidebar} aria-label="Open chat history">
      <span />
      <span />
      <span />
    </button>
    <div className="chat-mobile-copy">
      <strong>Mate.ai chat</strong>
      <span>{title}</span>
    </div>
    <button
      type="button"
      className="chat-icon-btn chat-icon-btn-ghost"
      onClick={onOpenCommandPalette}
      aria-label="Open command menu"
    >
      K
    </button>
    <button type="button" className="chat-icon-btn chat-icon-btn-accent" onClick={onNewChat} aria-label="New chat">
      +
    </button>
  </header>
);

export default ChatMobileBar;
