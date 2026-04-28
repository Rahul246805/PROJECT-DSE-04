import React, { useEffect, useMemo, useRef, useState } from 'react';
import './CommandPalette.css';

const CommandPalette = ({ open, onClose, commands = [] }) => {
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  const filteredCommands = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return commands;
    }

    return commands.filter((command) =>
      [command.label, command.description, ...(command.keywords || [])]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [commands, query]);

  if (!open) {
    return null;
  }

  return (
    <div className="command-palette-root" role="dialog" aria-modal="true" aria-label="Command menu">
      <button type="button" className="command-palette-backdrop" onClick={onClose} aria-label="Close command menu" />
      <div className="command-palette-card">
        <div className="command-palette-head">
          <span className="command-palette-kicker">Mate.ai command palette</span>
          <span className="command-palette-shortcut">Ctrl/Cmd + K</span>
        </div>

        <input
          ref={inputRef}
          type="text"
          className="command-palette-input"
          placeholder="Search commands, prompts, and tools"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <div className="command-palette-list" role="listbox" aria-label="Available commands">
          {filteredCommands.map((command) => (
            <button
              key={command.id}
              type="button"
              className="command-palette-item"
              onClick={() => {
                command.onSelect?.();
                onClose?.();
              }}
            >
              <span className="command-palette-item-copy">
                <strong>{command.label}</strong>
                <span>{command.description}</span>
              </span>
              {command.shortcut ? <span className="command-palette-item-key">{command.shortcut}</span> : null}
            </button>
          ))}

          {filteredCommands.length === 0 && (
            <div className="command-palette-empty">
              <strong>No commands found</strong>
              <span>Try a broader keyword like search, image, settings, or new chat.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
