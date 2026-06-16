import { createSlice } from '@reduxjs/toolkit';

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    chats: [],
    activeChatId: null,
    isSending: false,
    input: '',
  },
  reducers: {
    startNewChat: {
      reducer(state, action) {
        const { _id, title, preferredModel } = action.payload;
        state.chats.unshift({
          _id,
          title: title || 'New Chat',
          preferredModel: preferredModel || 'llama-3.3-70b-versatile',
          messages: [],
        });
        state.activeChatId = _id;
      },
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

      if (state.activeChatId && !state.chats.some((chat) => chat._id === state.activeChatId)) {
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
      }

      state.chats.unshift(incomingChat);
    },
    resetChatState(state) {
      state.chats = [];
      state.activeChatId = null;
      state.isSending = false;
      state.input = '';
    },
  },
});

export const {
  startNewChat,
  selectChat,
  setInput,
  sendingStarted,
  sendingFinished,
  setChats,
  removeChat,
  upsertChat,
  resetChatState,
} = chatSlice.actions;

export default chatSlice.reducer;
