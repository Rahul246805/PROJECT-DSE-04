import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import './ChatMessages.css';

function formatMessageTime(value) {
  if (!value) {
    return 'Just now';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Just now';
  }

  const now = new Date();
  const sameDay = now.toDateString() === date.toDateString();

  return new Intl.DateTimeFormat(undefined, {
    ...(sameDay ? {} : { month: 'short', day: 'numeric' }),
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function renderInline(text, keyBase = 'inline') {
  const pattern =
    /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\((?:https?:\/\/[^\s)]+)\))/g;
  const parts = text.split(pattern).filter(Boolean);

  return parts.map((part, index) => {
    const key = `${keyBase}-${index}`;

    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={key}>{part.slice(1, -1)}</code>;
    }

    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }

    const linkMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);

    if (linkMatch) {
      return (
        <a key={key} href={linkMatch[2]} target="_blank" rel="noreferrer">
          {linkMatch[1]}
        </a>
      );
    }

    return part;
  });
}

function renderTextBlock(text, blockIndex) {
  const lines = text.split('\n');
  const blocks = [];
  let currentParagraph = [];
  let currentList = [];

  const flushParagraph = () => {
    if (currentParagraph.length === 0) {
      return;
    }

    const paragraphText = currentParagraph.join(' ').trim();

    if (paragraphText) {
      blocks.push(
        <p key={`paragraph-${blockIndex}-${blocks.length}`}>
          {renderInline(paragraphText, `paragraph-${blockIndex}-${blocks.length}`)}
        </p>
      );
    }

    currentParagraph = [];
  };

  const flushList = () => {
    if (currentList.length === 0) {
      return;
    }

    blocks.push(
      <ul key={`list-${blockIndex}-${blocks.length}`}>
        {currentList.map((item, itemIndex) => (
          <li key={`list-${blockIndex}-${itemIndex}`}>
            {renderInline(item, `list-${blockIndex}-${itemIndex}`)}
          </li>
        ))}
      </ul>
    );

    currentList = [];
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      return;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      flushParagraph();
      currentList.push(trimmed.slice(2));
      return;
    }

    if (trimmed.startsWith('# ')) {
      flushParagraph();
      flushList();
      blocks.push(
        <h4 key={`heading-${blockIndex}-${blocks.length}`}>
          {renderInline(trimmed.slice(2), `heading-${blockIndex}-${blocks.length}`)}
        </h4>
      );
      return;
    }

    currentParagraph.push(trimmed);
  });

  flushParagraph();
  flushList();

  return blocks;
}

function renderMarkdown(content, onCopy) {
  const output = [];
  const codePattern = /```(\w+)?\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codePattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      output.push(
        <div key={`text-${lastIndex}`} className="msg-rich-text">
          {renderTextBlock(content.slice(lastIndex, match.index), lastIndex)}
        </div>
      );
    }

    output.push(
      <div key={`code-${match.index}`} className="msg-code-block">
        <div className="msg-code-head">
          <span>{match[1] || 'code'}</span>
          <button type="button" onClick={() => onCopy(match[2].trimEnd())}>
            Copy code
          </button>
        </div>
        <pre>
          <code>{match[2].trimEnd()}</code>
        </pre>
      </div>
    );

    lastIndex = codePattern.lastIndex;
  }

  if (lastIndex < content.length) {
    output.push(
      <div key={`text-tail-${lastIndex}`} className="msg-rich-text">
        {renderTextBlock(content.slice(lastIndex), lastIndex)}
      </div>
    );
  }

  return output;
}

const MessageBody = ({ message, onCopy }) => {
  const [displayedContent, setDisplayedContent] = useState(message.content);

  useEffect(() => {
    if (!message.streaming || message.type !== 'ai') {
      setDisplayedContent(message.content);
      return undefined;
    }

    let timeoutId;
    let currentIndex = 0;
    const content = message.content;

    const revealNextChunk = () => {
      currentIndex = Math.min(
        content.length,
        currentIndex + Math.max(1, Math.ceil(content.length / 42))
      );
      setDisplayedContent(content.slice(0, currentIndex));

      if (currentIndex < content.length) {
        timeoutId = window.setTimeout(revealNextChunk, 18 + Math.random() * 20);
      }
    };

    setDisplayedContent('');
    revealNextChunk();

    return () => window.clearTimeout(timeoutId);
  }, [message.content, message.streaming, message.type]);

  return <>{renderMarkdown(displayedContent || '', onCopy)}</>;
};

const ChatMessages = ({
  messages,
  isSending,
  onEditMessage,
  editingMessageId,
  regeneratableMessageId,
  onRegenerateMessage,
  onRetryMessage,
}) => {
  const bottomRef = useRef(null);
  const utteranceRef = useRef(null);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isSending]);

  useEffect(() => {
    if (!canSpeak) {
      return undefined;
    }

    return () => {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
    };
  }, [canSpeak]);

  const handleCopy = async (text) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      toast.success('Copied to clipboard');
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('Unable to copy this message');
    }
  };

  const handleSpeak = (messageKey, text) => {
    try {
      if (!canSpeak) {
        return;
      }

      if (speakingMessageId === messageKey) {
        window.speechSynthesis.cancel();
        utteranceRef.current = null;
        setSpeakingMessageId(null);
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      utterance.onend = () => {
        utteranceRef.current = null;
        setSpeakingMessageId((current) => (current === messageKey ? null : current));
      };

      utterance.onerror = () => {
        utteranceRef.current = null;
        setSpeakingMessageId((current) => (current === messageKey ? null : current));
      };

      utteranceRef.current = utterance;
      setSpeakingMessageId(messageKey);
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error(error);
      setSpeakingMessageId(null);
    }
  };

  return (
    <div className="messages">
      {messages.map((message) => {
        const messageKey = message.id;

        return (
          <article
            key={messageKey}
            className={`msg ${
              message.type === 'user' ? 'msg-user' : 'msg-ai'
            } ${message.error ? 'msg-error' : ''}`}
          >
            <div className="msg-head">
              <span className="msg-role">{message.type === 'user' ? 'You' : 'Mate.ai'}</span>
              <span className="msg-time">{formatMessageTime(message.createdAt)}</span>
            </div>
            {message.type === 'ai' && (message.model || message.usage?.total_tokens) && (
              <div className="msg-head">
                <span className="msg-time">
                  {[message.model, message.usage?.total_tokens ? `${message.usage.total_tokens} tokens` : '']
                    .filter(Boolean)
                    .join(' - ')}
                </span>
              </div>
            )}

            <div className="msg-bubble">
              <MessageBody message={message} onCopy={handleCopy} />
            </div>

            <div className="msg-actions">
              <button type="button" onClick={() => handleCopy(message.content)}>
                Copy
              </button>

              {message.type === 'user' && (
                <button
                  type="button"
                  onClick={() => onEditMessage?.(message)}
                  disabled={editingMessageId === messageKey}
                >
                  {editingMessageId === messageKey ? 'Editing' : 'Edit'}
                </button>
              )}

              {message.type === 'ai' && !message.error && message.id === regeneratableMessageId && (
                <button type="button" onClick={() => onRegenerateMessage?.(message.id)}>
                  Regenerate
                </button>
              )}

              {message.type === 'ai' && message.error && (
                <button type="button" onClick={() => onRetryMessage?.(message.id)}>
                  Retry
                </button>
              )}

              {message.type === 'ai' && canSpeak && !message.error && (
                <button type="button" onClick={() => handleSpeak(messageKey, message.content)}>
                  {speakingMessageId === messageKey ? 'Stop' : 'Speak'}
                </button>
              )}
            </div>
          </article>
        );
      })}

      {isSending && messages[messages.length - 1]?.type === 'user' && (
        <article className="msg msg-ai">
          <div className="msg-head">
            <span className="msg-role">Mate.ai</span>
            <span className="msg-time">Working...</span>
          </div>

          <div className="msg-bubble msg-bubble-pending">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="msg-pending-copy">Mate.ai is typing...</span>
          </div>
        </article>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

export default ChatMessages;
