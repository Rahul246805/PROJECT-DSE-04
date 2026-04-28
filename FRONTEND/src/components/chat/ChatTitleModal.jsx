import React, { useEffect, useRef } from 'react';
import './ChatTitleModal.css';

const ChatTitleModal = ({
  open,
  title,
  error,
  isSubmitting,
  onChange,
  onClose,
  onSubmit,
}) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="chat-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="chat-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-title-heading"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="chat-modal-copy">
          <p className="chat-modal-kicker">New Mate.ai chat</p>
          <h2 id="chat-title-heading">Name your conversation</h2>
          <p>Choose a short title so you can find this chat again later.</p>
        </div>

        <form
          className="chat-modal-form"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <label htmlFor="chat-title-input">Chat title</label>
          <input
            id="chat-title-input"
            ref={inputRef}
            value={title}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Example: Landing page bug fixes"
            maxLength={80}
          />
          {error ? <p className="chat-modal-error">{error}</p> : null}

          <div className="chat-modal-actions">
            <button type="button" className="chat-modal-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="chat-modal-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create chat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatTitleModal;
