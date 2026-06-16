import React, { useLayoutEffect, useRef } from 'react';
import './ChatComposer.css';

const QUICK_ACTIONS = [
  'Document Analysis',
  'Web Search',
  'AI Health Report Analyzer',
  'Taxi Fare Estimator',
  'Career Assistant',
  'Resume Analyzer',
  'Admin Dashboard Analytics',
];

const TOOL_ACTIONS = [
  { label: 'Doc', action: 'document' },
  { label: 'Search', action: 'web' },
  { label: 'Health', action: 'health' },
  { label: 'Taxi', action: 'taxi' },
  { label: 'Resume', action: 'resume' },
  { label: 'Admin', action: 'admin' },
];

const ChatComposer = ({
  input,
  setInput,
  onSend,
  isSending,
  isVoiceListening = false,
  onQuickAction,
  onToolAction,
  attachments = [],
  onPickFiles,
  onRemoveAttachment,
  isEditing = false,
  editingMessageContent = '',
  onCancelEdit,
  onStop,
  selectedModel = 'llama-3.3-70b-versatile',
  onSelectModel,
  selectedMode = 'developer',
  onSelectMode,
  selectedTool = 'general',
  onSelectTool,
  lastUsage = null,
  compact = false,
}) => {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useLayoutEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 220)}px`;
  }, [input]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (input.trim() || attachments.length > 0) {
      onSend();
    }
  };

  return (
    <form className={`composer ${compact ? 'composer-compact' : ''}`} onSubmit={handleSubmit}>
      <div className={`composer-surface ${isSending ? 'sending' : ''}`}>
        <div className="composer-field">
          {isEditing && (
            <div className="composer-editing-banner" role="status" aria-live="polite">
              <div>
                <strong>Editing your prompt</strong>
                <span>Saving will replace the old reply with a new one.</span>
              </div>
              <button type="button" onClick={onCancelEdit}>
                Cancel
              </button>
            </div>
          )}

          {attachments.length > 0 && (
            <div className="composer-attachments" aria-label="Selected attachments">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="composer-attachment-card">
                  {attachment.previewUrl ? (
                    <img
                      src={attachment.previewUrl}
                      alt={attachment.name}
                      className="composer-attachment-preview"
                    />
                  ) : (
                    <div className="composer-attachment-icon">
                      {attachment.kind === 'image' ? 'IMG' : 'FILE'}
                    </div>
                  )}
                  <div className="composer-attachment-copy">
                    <strong>{attachment.name}</strong>
                    <span>{attachment.meta}</span>
                  </div>
                  <button
                    type="button"
                    className="composer-attachment-remove"
                    onClick={() => onRemoveAttachment?.(attachment.id)}
                    aria-label={`Remove ${attachment.name}`}
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}

          <textarea
            ref={textareaRef}
            id="chat-composer-input"
            className="composer-input"
            placeholder={isEditing ? 'Update your prompt...' : 'Message Mate.ai...'}
            aria-label="Message"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                if (input.trim() || attachments.length > 0) onSend();
              }
            }}
            rows={1}
            spellCheck
          />
          <input
            ref={fileInputRef}
            type="file"
            className="composer-file-input"
            accept="image/*,.pdf,.txt,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.json,.md"
            multiple
            onChange={(event) => {
              onPickFiles?.(event.target.files);
              event.target.value = '';
            }}
          />
          <div className="composer-toolbar">
            <div className="composer-mode-row" aria-label="AI workspace modes">
              <select
                className="composer-tool-pill composer-select"
                aria-label="Select role mode"
                value={selectedMode}
                onChange={(event) => onSelectMode?.(event.target.value)}
              >
                <option value="developer">Developer mode</option>
                <option value="student">Student mode</option>
                <option value="researcher">Researcher mode</option>
                <option value="career">Career coach mode</option>
              </select>
              <select
                className="composer-tool-pill composer-select"
                aria-label="Select tool mode"
                value={selectedTool}
                onChange={(event) => onSelectTool?.(event.target.value)}
              >
                <option value="general">General chat</option>
                <option value="document">Document analysis</option>
                <option value="web">Web search</option>
                <option value="health">Health report</option>
                <option value="taxi">Taxi estimator</option>
                <option value="resume">Resume analyzer</option>
                <option value="admin">Admin analytics</option>
              </select>
            </div>
            <div className="composer-tool-group composer-tool-group-primary">
              <button
                type="button"
                className="composer-tool-icon composer-tool-icon-strong"
                aria-label="Attach files"
                onClick={() => fileInputRef.current?.click()}
              >
                + Attach
              </button>
              <button
                type="button"
                className="composer-tool-icon"
                aria-label="Paste clipboard text"
                onClick={() => onToolAction?.('clipboard')}
              >
                Paste
              </button>
              {TOOL_ACTIONS.map((tool) => (
                <button
                  key={tool.action}
                  type="button"
                  className={`composer-tool-pill ${selectedTool === tool.action ? 'active' : ''}`}
                  onClick={() => onToolAction?.(tool.action)}
                >
                  {tool.label}
                </button>
              ))}
            </div>
            <div className="composer-tool-group composer-tool-group-secondary">
              <select
                className="composer-tool-pill composer-select"
                aria-label="Select AI model"
                value={selectedModel}
                onChange={(event) => onSelectModel?.(event.target.value)}
              >
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B</option>
                <option value="llama-3.1-8b-instant">Llama 3.1 8B Fast</option>
                <option value="openai/gpt-oss-120b">GPT OSS 120B</option>
                <option value="openai/gpt-oss-20b">GPT OSS 20B</option>
              </select>
              <button
                type="button"
                className="composer-tool-icon"
                aria-label={isVoiceListening ? 'Stop voice input' : 'Voice input'}
                onClick={() => onToolAction?.('voice')}
              >
                {isVoiceListening ? 'Listening' : 'Mic'}
              </button>
              {isSending && (
                <button
                  type="button"
                  className="composer-tool-icon"
                  aria-label="Stop generation"
                  onClick={onStop}
                >
                  Stop
                </button>
              )}
            </div>
          </div>

          <div className="composer-meta">
            <div className="composer-meta-status">
              <span className="composer-meta-hint">
                {isEditing ? 'Enter to save' : 'Enter to send'}
              </span>
              <span className="composer-meta-separator" aria-hidden="true" />
              <span className="composer-meta-hint">Shift + Enter newline</span>
              <span className="composer-meta-separator" aria-hidden="true" />
              <span className="composer-meta-hint">Ctrl/Cmd + K commands</span>
            </div>
            {isEditing && editingMessageContent ? (
              <span className="composer-meta-note">Original prompt loaded for editing</span>
            ) : (
              <span className="composer-meta-note">
                {lastUsage?.total_tokens
                  ? `Last response used ${lastUsage.total_tokens} tokens`
                  : 'Supports files, pasted content, image prompts, and voice'}
              </span>
            )}
          </div>
        </div>

        <div className="composer-send-column">
          <span className="composer-send-label">{isSending ? 'Sending' : 'Send'}</span>
          <button
            type="submit"
            className="send-btn"
            disabled={(!input.trim() && attachments.length === 0) || isSending}
            aria-label={isSending ? 'Sending' : 'Send message'}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h10" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {!compact && (
        <div className="composer-chips" aria-hidden="true">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              type="button"
              className="composer-chip"
              onClick={() => onQuickAction?.(action)}
            >
              {action}
            </button>
          ))}
        </div>
      )}
    </form>
  );
};

export default ChatComposer;
