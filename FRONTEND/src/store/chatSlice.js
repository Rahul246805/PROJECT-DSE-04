import { createSlice, nanoid } from '@reduxjs/toolkit';

// helpers
const createEmptyChat = (title) => ({ id: nanoid(), title: title || 'New Chat', messages: [] });

const chatSlice = createSlice({
    name: 'chat',
    initialState: {
        chats: [],
        activeChatId: null,
        isSending: false,
        input: ''
    },
    reducers: {
        ensureInitialChat(state) {
            if (state.chats.length === 0) {
                const chat = createEmptyChat();
                state.chats.unshift(chat);
                state.activeChatId = chat.id;
            }
        },
        startNewChat: {
            reducer(state, action) {
                const { _id, title } = action.payload;
                state.chats.unshift({ _id, title: title || 'New Chat', messages: [] });
                state.activeChatId = _id;
            }
        },
        selectChat(state, action) {
            state.activeChatId = action.payload;
        },
        setInput(state, action) {
            state.input = action.payload;
        },
        sendingStarted(state) {
            state.isSending = true;
        },
        sendingFinished(state) {
            state.isSending = false;
        },
        setChats(state, action) {
            state.chats = action.payload;
            if (
                state.activeChatId &&
                !state.chats.some((chat) => chat._id === state.activeChatId)
            ) {
                state.activeChatId = state.chats[0]?._id ?? null;
            }
        },
        removeChat(state, action) {
            const chatId = action.payload;
            state.chats = state.chats.filter((chat) => chat._id !== chatId);

            if (state.activeChatId === chatId) {
                state.activeChatId = state.chats[0]?._id ?? null;
            }
        },
        upsertChat(state, action) {
            const incomingChat = action.payload;
            const existingIndex = state.chats.findIndex((chat) => chat._id === incomingChat._id);

            if (existingIndex >= 0) {
                state.chats.splice(existingIndex, 1);
                state.chats.unshift(incomingChat);
            } else {
                state.chats.unshift(incomingChat);
            }
        },
        addUserMessage: {
            reducer(state, action) {
                const { chatId, message } = action.payload;
                const chat = state.chats.find(c => c.id === chatId);
                if (!chat) return;
                if (chat.messages.length === 0) {
                    chat.title = message.content.slice(0, 40) + (message.content.length > 40 ? '…' : '');
                }
                chat.messages.push(message);
            },
            prepare(chatId, content) {
                return { payload: { chatId, message: { id: nanoid(), role: 'user', content, ts: Date.now() } } };
            }
        },
        addAIMessage: {
            reducer(state, action) {
                const { chatId, message } = action.payload;
                const chat = state.chats.find(c => c.id === chatId);
                if (!chat) return;
                chat.messages.push(message);
            },
            prepare(chatId, content, error = false) {
                return { payload: { chatId, message: { id: nanoid(), role: 'ai', content, ts: Date.now(), ...(error ? { error: true } : {}) } } };
            }
        },
        resetChatState(state) {
            state.chats = [];
            state.activeChatId = null;
            state.isSending = false;
            state.input = '';
        }
    }
});

export const {
    ensureInitialChat,
    startNewChat,
    selectChat,
    setInput,
    sendingStarted,
    sendingFinished,
    addUserMessage,
    addAIMessage,
    setChats,
    removeChat,
    upsertChat,
    resetChatState
} = chatSlice.actions;

export default chatSlice.reducer;
