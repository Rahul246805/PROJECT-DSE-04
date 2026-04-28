import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import CommandPalette from '../components/chat/CommandPalette.jsx';
import ChatMobileBar from '../components/chat/ChatMobileBar.jsx';
import ChatSidebar from '../components/chat/ChatSidebar.jsx';
import ChatMessages from '../components/chat/ChatMessages.jsx';
import ChatComposer from '../components/chat/ChatComposer.jsx';
import ChatTitleModal from '../components/chat/ChatTitleModal.jsx';
import SettingsPanel from '../components/chat/SettingsPanel.jsx';
import WorkspaceScene from '../components/chat/WorkspaceScene.jsx';
import '../components/chat/ChatLayout.css';

import {
  startNewChat,
  selectChat,
  setInput,
  sendingStarted,
  sendingFinished,
  setChats,
  removeChat,
  resetChatState,
  upsertChat,
} from '../store/chatSlice.js';

import {
  createGuestSession,
  createChat,
  deleteChat,
  fetchChats,
  fetchMessages,
  getStoredAuthUser,
  getErrorMessage,
  logoutUser,
  sendChatMessage,
  updateChatMessage,
} from '../components/chat/aiClient.js';

const FALLBACK_REPLY = 'Sorry, something went wrong. Please try again.';
const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
const MAX_ATTACHMENT_TEXT_LENGTH = 1600;

function buildAutoChatTitle(message) {
  const trimmed = message.trim();

  if (!trimmed) {
    return 'New Mate.ai Chat';
  }

  return trimmed.length > 48 ? `${trimmed.slice(0, 48)}...` : trimmed;
}

function formatFileSize(bytes) {
  if (!bytes) {
    return '0 KB';
  }

  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read file.'));
    reader.readAsText(file);
  });
}

async function createAttachment(file) {
  const isImage = file.type.startsWith('image/');
  const isTextLike =
    file.type.startsWith('text/') ||
    ['application/json', 'text/csv'].includes(file.type) ||
    /\.(txt|md|json|csv|js|jsx|ts|tsx|html|css)$/i.test(file.name);

  let excerpt = '';

  if (isTextLike) {
    const text = await readFileAsText(file);
    excerpt = text.slice(0, MAX_ATTACHMENT_TEXT_LENGTH);
  }

  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    size: file.size,
    type: file.type || 'unknown',
    meta: `${isImage ? 'Image' : 'File'} - ${formatFileSize(file.size)}`,
    kind: isImage ? 'image' : 'file',
    previewUrl: isImage ? URL.createObjectURL(file) : '',
    excerpt,
  };
}

function buildAttachmentContext(attachments) {
  if (attachments.length === 0) {
    return '';
  }

  const lines = attachments.map((attachment) => {
    const excerptLine = attachment.excerpt
      ? ` | excerpt: ${attachment.excerpt.replace(/\s+/g, ' ').trim()}`
      : '';

    return `- ${attachment.name} (${attachment.type || 'file'}, ${formatFileSize(attachment.size)})${excerptLine}`;
  });

  return `Attached files:\n${lines.join('\n')}`;
}

function buildDisplayedMessage(message, attachments) {
  const trimmed = message.trim();

  if (attachments.length === 0) {
    return trimmed;
  }

  const attachmentSummary = attachments.map((attachment) => `- ${attachment.name}`).join('\n');
  const heading = trimmed || 'Shared attachments';

  return `${heading}\n\nAttachments:\n${attachmentSummary}`;
}

function normalizeMessageRecord(message) {
  return {
    id: message._id,
    type: message.role === 'user' ? 'user' : 'ai',
    content: message.content,
    rawContent: message.content,
    error: false,
    createdAt: message.createdAt || new Date().toISOString(),
    streaming: false,
  };
}

function applyStreamingFlag(messages, streamLastAi = false) {
  if (!streamLastAi) {
    return messages;
  }

  let targetIndex = -1;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].type === 'ai') {
      targetIndex = index;
      break;
    }
  }

  if (targetIndex === -1) {
    return messages;
  }

  return messages.map((message, index) => ({
    ...message,
    streaming: index === targetIndex,
  }));
}

function focusComposerInput() {
  window.requestAnimationFrame(() => {
    document.getElementById('chat-composer-input')?.focus();
  });
}

function ensurePrefixedPrompt(currentInput, prefix) {
  const trimmed = currentInput.trim();
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const repeatedPrefixPattern = new RegExp(`^(?:${escapedPrefix})+`, 'i');

  if (!trimmed) {
    return prefix;
  }

  const normalizedBody = trimmed.replace(repeatedPrefixPattern, '').trimStart();

  if (!normalizedBody) {
    return prefix;
  }

  return `${prefix}${normalizedBody}`;
}

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const chats = useSelector((state) => state.chat.chats);
  const activeChatId = useSelector((state) => state.chat.activeChatId);
  const input = useSelector((state) => state.chat.input);
  const isSending = useSelector((state) => state.chat.isSending);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [titleModalOpen, setTitleModalOpen] = useState(false);
  const [chatTitle, setChatTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [activePanel, setActivePanel] = useState('chat');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [deletingChatId, setDeletingChatId] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageContent, setEditingMessageContent] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => getStoredAuthUser());
  const guestSessionPromiseRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const speechStartInputRef = useRef('');
  const speechHadResultRef = useRef(false);

  const activeChat = useMemo(
    () => chats.find((chat) => chat._id === activeChatId) ?? null,
    [activeChatId, chats]
  );

  const latestRegeneratableAiId = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index].type === 'ai' && !messages[index].error) {
        return messages[index].id;
      }
    }

    return null;
  }, [messages]);

  const clearAttachments = () => {
    setAttachments((current) => {
      current.forEach((attachment) => {
        if (attachment.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl);
        }
      });

      return [];
    });
  };

  const syncMessagesForChat = async (chatId, streamLastAi = false) => {
    const response = await fetchMessages(chatId);
    const nextMessages = applyStreamingFlag(
      (response.messages || []).map(normalizeMessageRecord),
      streamLastAi
    );
    setMessages(nextMessages);
    return nextMessages;
  };

  useEffect(() => {
    document.title =
      activePanel === 'settings'
        ? 'Settings | Mate.ai'
        : activeChat?.title
          ? `${activeChat.title} | Mate.ai`
          : 'Mate.ai';
  }, [activeChat, activePanel]);

  useEffect(() => {
    let ignore = false;

    async function ensureSession() {
      if (!guestSessionPromiseRef.current) {
        guestSessionPromiseRef.current = createGuestSession().finally(() => {
          guestSessionPromiseRef.current = null;
        });
      }

      return guestSessionPromiseRef.current;
    }

    async function loadWorkspace() {
      try {
        const response = await fetchChats();
        const availableChats = response.chats || [];

        if (ignore) return;

        setCurrentUser(getStoredAuthUser());
        dispatch(setChats(availableChats));

        if (availableChats.length > 0) {
          dispatch(selectChat(availableChats[0]._id));
        }
      } catch (error) {
        const message = getErrorMessage(error);

        if (!ignore && message.toLowerCase().includes('unauthorized')) {
          try {
            await ensureSession();
            const retryResponse = await fetchChats();
            const availableChats = retryResponse.chats || [];

            if (!ignore) {
              setCurrentUser(getStoredAuthUser());
              dispatch(setChats(availableChats));

              if (availableChats.length > 0) {
                dispatch(selectChat(availableChats[0]._id));
              }
            }
          } catch (guestError) {
            if (!ignore) {
              toast.error(getErrorMessage(guestError));
              navigate('/login');
            }
          }
        } else if (!ignore) {
          toast.error(message);
        }
      } finally {
        if (!ignore) {
          setIsBootstrapping(false);
        }
      }
    }

    loadWorkspace();

    return () => {
      ignore = true;
    };
  }, [dispatch, navigate]);

  useEffect(() => {
    setEditingMessageId(null);
    setEditingMessageContent('');
    clearAttachments();
    setCommandPaletteOpen(false);
  }, [activeChatId, activePanel]);

  useEffect(
    () => () => {
      attachments.forEach((attachment) => {
        if (attachment.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl);
        }
      });

      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.onresult = null;
        speechRecognitionRef.current.onerror = null;
        speechRecognitionRef.current.onend = null;
        speechRecognitionRef.current.onstart = null;
        speechRecognitionRef.current.stop();
        speechRecognitionRef.current = null;
      }
    },
    [attachments]
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadChatMessages() {
      if (!activeChatId) {
        setMessages([]);
        return;
      }

      try {
        const response = await fetchMessages(activeChatId);

        if (!ignore) {
          setMessages((response.messages || []).map(normalizeMessageRecord));
        }
      } catch (error) {
        if (!ignore) {
          toast.error(getErrorMessage(error));
        }
      }
    }

    if (activePanel === 'chat') {
      loadChatMessages();
    }

    return () => {
      ignore = true;
    };
  }, [activeChatId, activePanel]);

  const handleOpenNewChatModal = () => {
    setActivePanel('chat');
    setSidebarOpen(false);
    setCommandPaletteOpen(false);
    setTitleModalOpen(true);
    setChatTitle('');
    setTitleError('');
    setEditingMessageId(null);
    setEditingMessageContent('');
    clearAttachments();
  };

  const handleCloseNewChatModal = () => {
    if (isCreatingChat) return;
    setTitleModalOpen(false);
    setChatTitle('');
    setTitleError('');
  };

  const handleCreateChat = async () => {
    const trimmedTitle = chatTitle.trim();

    if (!trimmedTitle) {
      setTitleError('Please enter a chat title.');
      return;
    }

    setIsCreatingChat(true);
    setTitleError('');

    try {
      const response = await createChat(trimmedTitle);
      dispatch(startNewChat(response.chat));
      setActivePanel('chat');
      setMessages([]);
      setSidebarOpen(false);
      setTitleModalOpen(false);
      setChatTitle('');
      dispatch(setInput(''));
      clearAttachments();
    } catch (error) {
      const message = getErrorMessage(error);
      setTitleError(message);
      toast.error(message);
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleDeleteChat = async (chatId) => {
    const chatToDelete = chats.find((chat) => chat._id === chatId);

    if (!chatToDelete) return;

    const shouldDelete = window.confirm(`Delete "${chatToDelete.title}"?`);

    if (!shouldDelete) return;

    const previousChats = [...chats];
    const wasActive = activeChatId === chatId;

    setDeletingChatId(chatId);
    dispatch(removeChat(chatId));

    if (wasActive) {
      setMessages([]);
    }

    try {
      await deleteChat(chatId);
      toast.success('Chat deleted');
    } catch (error) {
      dispatch(setChats(previousChats));

      if (wasActive) {
        dispatch(selectChat(chatId));
      }

      toast.error(getErrorMessage(error));
    } finally {
      setDeletingChatId(null);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await logoutUser();
      setCurrentUser(null);
      dispatch(resetChatState());
      setMessages([]);
      setActivePanel('chat');
      navigate('/login');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSwitchAccount = async () => {
    setIsLoggingOut(true);

    try {
      await logoutUser();
      setCurrentUser(null);
      dispatch(resetChatState());
      setMessages([]);
      setActivePanel('chat');
      toast.success('Session cleared. Sign in with a different Gmail/email account.');
      navigate('/login');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleEditMessage = (message) => {
    setActivePanel('chat');
    setSidebarOpen(false);
    setEditingMessageId(message.id);
    setEditingMessageContent(message.rawContent || message.content);
    clearAttachments();
    dispatch(setInput(message.rawContent || message.content));
    focusComposerInput();
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingMessageContent('');
    clearAttachments();
    dispatch(setInput(''));
  };

  const handlePickFiles = async (fileList) => {
    const files = Array.from(fileList || []);

    if (files.length === 0) {
      return;
    }

    try {
      const acceptedFiles = files.filter((file) => file.size <= MAX_ATTACHMENT_SIZE);
      const rejectedFiles = files.length - acceptedFiles.length;

      if (rejectedFiles > 0) {
        toast.error('Some files were skipped because they are larger than 5 MB.');
      }

      const createdAttachments = await Promise.all(acceptedFiles.slice(0, 4).map(createAttachment));

      setAttachments((current) => [...current, ...createdAttachments].slice(0, 4));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleRemoveAttachment = (attachmentId) => {
    setAttachments((current) => {
      const target = current.find((attachment) => attachment.id === attachmentId);

      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return current.filter((attachment) => attachment.id !== attachmentId);
    });
  };

  const handleQuickAction = (value) => {
    setActivePanel('chat');
    setSidebarOpen(false);
    dispatch(setInput(value));
    focusComposerInput();
  };

  const handleToolAction = async (action) => {
    const currentInput = input.trim();

    if (action === 'search') {
      setActivePanel('chat');
      dispatch(setInput(ensurePrefixedPrompt(currentInput, 'Search the web for: ')));
      focusComposerInput();
      return;
    }

    if (action === 'image') {
      setActivePanel('chat');
      dispatch(setInput(ensurePrefixedPrompt(currentInput, 'Create an image for: ')));
      focusComposerInput();
      return;
    }

    if (action === 'clipboard') {
      try {
        if (!navigator?.clipboard?.readText) {
          toast.error('Clipboard paste is not supported in this browser.');
          return;
        }

        const clipboardText = await navigator.clipboard.readText();

        if (!clipboardText.trim()) {
          toast.error('Clipboard is empty.');
          return;
        }

        dispatch(setInput(currentInput ? `${currentInput}\n\n${clipboardText}` : clipboardText));
        focusComposerInput();
      } catch {
        toast.error('Unable to read from clipboard.');
      }

      return;
    }

    if (action === 'voice') {
      const SpeechRecognition =
        typeof window !== 'undefined' &&
        (window.SpeechRecognition || window.webkitSpeechRecognition);

      if (!SpeechRecognition) {
        toast.error('Voice input is not supported in this browser.');
        return;
      }

      if (isVoiceListening && speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
        return;
      }

      try {
        const recognition = new SpeechRecognition();
        const baseInput = currentInput;

        speechStartInputRef.current = baseInput;
        speechHadResultRef.current = false;

        recognition.lang = navigator?.language || 'en-US';
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsVoiceListening(true);
          toast.success('Listening...');
        };

        recognition.onresult = (event) => {
          const transcript = Array.from(event.results || [])
            .map((result) => result?.[0]?.transcript || '')
            .join(' ')
            .trim();

          if (!transcript) {
            return;
          }

          speechHadResultRef.current = true;
          dispatch(setInput(baseInput ? `${baseInput} ${transcript}`.trim() : transcript));
          focusComposerInput();
        };

        recognition.onerror = (event) => {
          setIsVoiceListening(false);

          if (event.error === 'aborted') {
            return;
          }

          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            toast.error('Microphone permission was blocked. Please allow mic access and try again.');
            return;
          }

          if (event.error === 'no-speech') {
            toast.error('No speech was detected. Please try again.');
            return;
          }

          if (event.error === 'audio-capture') {
            toast.error('No microphone was found. Please check your audio input.');
            return;
          }

          toast.error('Voice input failed. Please try again.');
        };

        recognition.onend = () => {
          setIsVoiceListening(false);

          if (speechHadResultRef.current) {
            toast.success('Voice input added.');
          }
        };

        speechRecognitionRef.current = recognition;
        recognition.start();
      } catch {
        toast.error('Unable to start voice input.');
        setIsVoiceListening(false);
      }
    }
  };

  const commandPaletteCommands = useMemo(
    () => [
      {
        id: 'new-chat',
        label: 'Start new chat',
        description: 'Open the new conversation modal and create a fresh workspace thread.',
        shortcut: 'N',
        keywords: ['new', 'chat', 'conversation'],
        onSelect: handleOpenNewChatModal,
      },
      {
        id: 'focus-message',
        label: 'Focus message composer',
        description: 'Jump straight to the input field so you can start typing.',
        shortcut: 'I',
        keywords: ['focus', 'input', 'message', 'composer'],
        onSelect: () => {
          setActivePanel('chat');
          setSidebarOpen(false);
          focusComposerInput();
        },
      },
      {
        id: 'search-web',
        label: 'Search the web',
        description: 'Prefill the composer with a web search instruction.',
        shortcut: 'S',
        keywords: ['search', 'web', 'browse'],
        onSelect: () => handleToolAction('search'),
      },
      {
        id: 'image-prompt',
        label: 'Create an image prompt',
        description: 'Prefill the composer with an image generation request.',
        shortcut: 'G',
        keywords: ['image', 'generate', 'visual'],
        onSelect: () => handleToolAction('image'),
      },
      {
        id: 'voice-input',
        label: 'Start voice input',
        description: 'Use speech recognition to add a prompt hands-free.',
        shortcut: 'V',
        keywords: ['voice', 'microphone', 'speech'],
        onSelect: () => handleToolAction('voice'),
      },
      {
        id: 'settings',
        label: 'Open workspace settings',
        description: 'Review account, privacy, and workspace behavior.',
        shortcut: ',',
        keywords: ['settings', 'account', 'workspace'],
        onSelect: () => {
          setActivePanel('settings');
          setSidebarOpen(false);
        },
      },
    ],
    [handleToolAction, handleOpenNewChatModal]
  );

  const sendMessage = async () => {
    const trimmed = input.trim();
    const attachmentContext = buildAttachmentContext(attachments);
    const displayedMessage = buildDisplayedMessage(trimmed, attachments);
    const payloadMessage = [trimmed, attachmentContext].filter(Boolean).join('\n\n');

    if (!trimmed && attachments.length === 0) {
      toast.error('Please enter a message or attach a file before sending.');
      return;
    }

    if (isSending) return;

    dispatch(sendingStarted());

    const previousMessages = messages;
    const currentEditingId = editingMessageId;
    const isEditing = Boolean(currentEditingId);
    const outgoingAttachments = attachments;

    let resolvedChatId = activeChatId;
    let resolvedChat = activeChat;

    if (isEditing) {
      const editingIndex = messages.findIndex((message) => message.id === currentEditingId);

      if (editingIndex === -1) {
        dispatch(sendingFinished());
        toast.error('The message you wanted to edit is no longer available.');
        setEditingMessageId(null);
        setEditingMessageContent('');
        return;
      }

      setMessages((prev) =>
        prev.slice(0, editingIndex + 1).map((message, index) =>
          index === editingIndex
            ? {
                ...message,
                content: displayedMessage,
                rawContent: payloadMessage,
                error: false,
              }
            : message
        )
      );
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          type: 'user',
          content: displayedMessage,
          rawContent: payloadMessage,
          error: false,
          createdAt: new Date().toISOString(),
          streaming: false,
        },
      ]);
    }

    dispatch(setInput(''));
    setEditingMessageId(null);
    setEditingMessageContent('');

    try {
      if (isEditing) {
        const response = await updateChatMessage({
          messageId: currentEditingId,
          content: payloadMessage,
        });

        if (!response.success || !response.reply?.trim()) {
          throw new Error(FALLBACK_REPLY);
        }

        if (response.chat) {
          dispatch(upsertChat(response.chat));
        }

        await syncMessagesForChat(activeChatId, true);
        clearAttachments();
        toast.success('Prompt updated and response refreshed.');
        return;
      }

      if (!resolvedChatId || !resolvedChat) {
        const createdChatResponse = await createChat(buildAutoChatTitle(displayedMessage));

        if (!createdChatResponse?.chat?._id) {
          throw new Error(FALLBACK_REPLY);
        }

        resolvedChat = createdChatResponse.chat;
        resolvedChatId = createdChatResponse.chat._id;
        dispatch(startNewChat(createdChatResponse.chat));
      }

      const response = await sendChatMessage({
        chatId: resolvedChatId,
        message: payloadMessage,
        userId: resolvedChat.userId || resolvedChat.user,
      });

      if (!response.success || !response.reply?.trim()) {
        throw new Error(FALLBACK_REPLY);
      }

      if (response.chat) {
        dispatch(upsertChat(response.chat));
      }

      await syncMessagesForChat(resolvedChatId, true);
      clearAttachments();
    } catch (error) {
      const message = getErrorMessage(error) || FALLBACK_REPLY;

      if (isEditing) {
        setMessages(previousMessages);
        setEditingMessageId(currentEditingId);
        setEditingMessageContent(displayedMessage);
        dispatch(setInput(trimmed));
        setAttachments(outgoingAttachments);
      } else {
        setAttachments(outgoingAttachments);
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-error-${Date.now()}`,
            type: 'ai',
            content: message,
            rawContent: message,
            error: true,
            createdAt: new Date().toISOString(),
            streaming: false,
          },
        ]);
      }

      toast.error(message);
    } finally {
      dispatch(sendingFinished());
    }
  };

  const handleRetryMessage = async (messageId) => {
    const messageIndex = messages.findIndex((message) => message.id === messageId);
    const sourceUserMessage = [...messages.slice(0, messageIndex)]
      .reverse()
      .find((message) => message.type === 'user');

    if (!sourceUserMessage || !activeChatId || isSending) {
      toast.error('There is no user prompt available to retry.');
      return;
    }

    setActivePanel('chat');
    dispatch(sendingStarted());
    setMessages((prev) => prev.filter((message) => message.id !== messageId));

    try {
      const response = await sendChatMessage({
        chatId: activeChatId,
        message: sourceUserMessage.rawContent || sourceUserMessage.content,
        userId: activeChat?.userId || activeChat?.user,
      });

      if (!response.success || !response.reply?.trim()) {
        throw new Error(FALLBACK_REPLY);
      }

      if (response.chat) {
        dispatch(upsertChat(response.chat));
      }

      await syncMessagesForChat(activeChatId, true);
      toast.success('Response retried.');
    } catch (error) {
      const message = getErrorMessage(error) || FALLBACK_REPLY;
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-error-${Date.now()}`,
          type: 'ai',
          content: message,
          rawContent: message,
          error: true,
          createdAt: new Date().toISOString(),
          streaming: false,
        },
      ]);
      toast.error(message);
    } finally {
      dispatch(sendingFinished());
    }
  };

  const handleRegenerateMessage = async (messageId) => {
    const messageIndex = messages.findIndex((message) => message.id === messageId);
    const sourceUserMessage = [...messages.slice(0, messageIndex)]
      .reverse()
      .find((message) => message.type === 'user');

    if (!sourceUserMessage?.id || sourceUserMessage.id.startsWith('user-') || isSending) {
      toast.error('This response needs to sync before it can be regenerated.');
      return;
    }

    const previousMessages = messages;
    setActivePanel('chat');
    dispatch(sendingStarted());
    setMessages(messages.slice(0, messageIndex));

    try {
      const response = await updateChatMessage({
        messageId: sourceUserMessage.id,
        content: sourceUserMessage.rawContent || sourceUserMessage.content,
      });

      if (!response.success || !response.reply?.trim()) {
        throw new Error(FALLBACK_REPLY);
      }

      if (response.chat) {
        dispatch(upsertChat(response.chat));
      }

      await syncMessagesForChat(activeChatId, true);
      toast.success('Fresh response generated.');
    } catch (error) {
      setMessages(previousMessages);
      toast.error(getErrorMessage(error));
    } finally {
      dispatch(sendingFinished());
    }
  };

  return (
    <div className="chat-app-shell">
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        commands={commandPaletteCommands}
      />

      <ChatTitleModal
        open={titleModalOpen}
        title={chatTitle}
        error={titleError}
        isSubmitting={isCreatingChat}
        onChange={(value) => {
          setChatTitle(value);
          if (titleError) setTitleError('');
        }}
        onClose={handleCloseNewChatModal}
        onSubmit={handleCreateChat}
      />

      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        activePanel={activePanel}
        currentUser={currentUser}
        onSelectChat={(id) => {
          dispatch(selectChat(id));
          setActivePanel('chat');
          setSidebarOpen(false);
        }}
        onNewChat={handleOpenNewChatModal}
        onOpenSettings={() => {
          setActivePanel('settings');
          setSidebarOpen(false);
        }}
        onOpenUpgrade={() => {
          setActivePanel('settings');
          setSidebarOpen(false);
          toast.success('Workspace settings opened.');
        }}
        onSwitchAccount={handleSwitchAccount}
        onDeleteChat={handleDeleteChat}
        deletingChatId={deletingChatId}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {sidebarOpen && (
        <button
          type="button"
          className="chat-overlay"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="chat-main-shell">
        <ChatMobileBar
          title={activePanel === 'settings' ? 'Settings' : activeChat?.title || 'Mate.ai Chat'}
          onToggleSidebar={() => setSidebarOpen(true)}
          onNewChat={handleOpenNewChatModal}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />

        <section className="chat-topbar">
          <div>
            <p className="chat-topbar-label">Mate.ai workspace</p>
            <h1>{activePanel === 'settings' ? 'Settings' : activeChat?.title || "What's on your mind today?"}</h1>
          </div>
          <div className="chat-topbar-actions">
            <button
              type="button"
              className="chat-topbar-btn chat-topbar-btn-secondary"
              onClick={() => setCommandPaletteOpen(true)}
            >
              Command menu
            </button>
            <button type="button" className="chat-topbar-btn" onClick={handleOpenNewChatModal}>
              New chat
            </button>
          </div>
        </section>

        <section className="chat-content-shell">
          {activePanel === 'chat' && (
            <WorkspaceScene variant={messages.length === 0 ? 'hero' : 'ambient'} active={isSending} />
          )}

          {activePanel === 'settings' ? (
            <SettingsPanel
              currentUser={currentUser}
              onLogout={handleLogout}
              onSwitchAccount={handleSwitchAccount}
              isLoggingOut={isLoggingOut}
            />
          ) : isBootstrapping ? (
            <div className="chat-empty-state">
              <div className="chat-loading-shell" aria-hidden="true">
                <div className="chat-loading-card chat-loading-card-wide" />
                <div className="chat-loading-row">
                  <div className="chat-loading-card" />
                  <div className="chat-loading-card" />
                  <div className="chat-loading-card" />
                </div>
                <div className="chat-loading-composer" />
              </div>
              <div className="chat-empty-stage">
                <div className="chat-empty-badge">Mate.ai workspace</div>
                <h2>Preparing your workspace...</h2>
                <p>Creating a secure session, syncing your chats, and warming up the interface.</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="chat-empty-state">
              <div className="chat-empty-stage">
                <div className="chat-empty-badge">Mate.ai workspace</div>
                <h2>Start calmer. Ship sharper.</h2>
                <p>
                  Plan, build, debug, and research in one responsive workspace designed for
                  focused conversations, stronger mobile behavior, and a cleaner Mate.ai chat
                  flow.
                </p>
              </div>

              <div className="chat-empty-composer">
                <ChatComposer
                  input={input}
                  setInput={(value) => dispatch(setInput(value))}
                  onSend={sendMessage}
                  isSending={isSending}
                  onQuickAction={handleQuickAction}
                  onToolAction={handleToolAction}
                  isVoiceListening={isVoiceListening}
                  attachments={attachments}
                  onPickFiles={handlePickFiles}
                  onRemoveAttachment={handleRemoveAttachment}
                  isEditing={Boolean(editingMessageId)}
                  editingMessageContent={editingMessageContent}
                  onCancelEdit={handleCancelEdit}
                  compact={false}
                />
              </div>
            </div>
          ) : (
            <ChatMessages
              messages={messages}
              isSending={isSending}
              onEditMessage={handleEditMessage}
              editingMessageId={editingMessageId}
              regeneratableMessageId={latestRegeneratableAiId}
              onRegenerateMessage={handleRegenerateMessage}
              onRetryMessage={handleRetryMessage}
            />
          )}
        </section>

        {activePanel === 'chat' && activeChatId && messages.length > 0 && (
          <div className="chat-composer-dock">
            <ChatComposer
              input={input}
              setInput={(value) => dispatch(setInput(value))}
              onSend={sendMessage}
              isSending={isSending}
              onQuickAction={handleQuickAction}
              onToolAction={handleToolAction}
              isVoiceListening={isVoiceListening}
              attachments={attachments}
              onPickFiles={handlePickFiles}
              onRemoveAttachment={handleRemoveAttachment}
              isEditing={Boolean(editingMessageId)}
              editingMessageContent={editingMessageContent}
              onCancelEdit={handleCancelEdit}
              compact
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
