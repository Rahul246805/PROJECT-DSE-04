import axios from 'axios';

let authTokenGetter = async () => null;

function resolveApiBaseUrl() {
  const envValue = import.meta.env.VITE_API_URL?.trim();
  const isProduction = import.meta.env.PROD;

  if (!envValue) {
    return '/api';
  }

  const normalized = envValue.replace(/\/$/, '');
  const lowerValue = normalized.toLowerCase();
  const isPlaceholderValue =
    lowerValue.includes('your-backend-service') ||
    lowerValue.includes('your-render-backend-url') ||
    lowerValue.includes('example.com');
  const isLocalBackend =
    lowerValue.includes('127.0.0.1') ||
    lowerValue.includes('localhost');

  if (isProduction && (isPlaceholderValue || isLocalBackend)) {
    return '/api';
  }

  return normalized;
}

const baseURL = resolveApiBaseUrl();

export function setAuthTokenGetter(getter) {
  authTokenGetter = typeof getter === 'function' ? getter : async () => null;
}

export function setClerkTokenGetter(getter) {
  setAuthTokenGetter(getter);
}

export const apiClient = axios.create({
  baseURL,
  timeout: 30000,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await authTokenGetter();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers?.Authorization) {
    delete config.headers.Authorization;
  }

  return config;
});

export const fetchApiHealth = async () => {
  const { data } = await apiClient.get('/health');
  return data;
};

export const fetchChats = async () => {
  const { data } = await apiClient.get('/chat');
  return data;
};

export const createChat = async (title, preferredModel) => {
  const { data } = await apiClient.post('/chat', { title, preferredModel });
  return data;
};

export const fetchMessages = async (chatId) => {
  const { data } = await apiClient.get(`/chat/messages/${chatId}`);
  return data;
};

export const deleteChat = async (chatId) => {
  const { data } = await apiClient.delete(`/chat/${chatId}`);
  return data;
};

export const sendChatMessage = async ({ chatId, message, userId, model, signal }) => {
  const payload = {
    chatId,
    message,
    ...(model ? { model } : {}),
    ...(userId ? { userId } : {}),
  };
  const { data } = await apiClient.post('/chat/message', payload, { signal });
  return data;
};

export const updateChatMessage = async ({ messageId, content, model, signal }) => {
  const { data } = await apiClient.put(`/chat/message/${messageId}`, { content, ...(model ? { model } : {}) }, { signal });
  return data;
};

export const submitContactForm = async (payload) => {
  const { data } = await apiClient.post('/contact', payload);
  return data;
};

export const loginWithPassword = async (payload) => {
  const { data } = await apiClient.post('/auth/login', payload);
  return data;
};

export const registerWithPassword = async (payload) => {
  const { data } = await apiClient.post('/auth/register', payload);
  return data;
};

export const loginAsGuest = async () => {
  const { data } = await apiClient.post('/auth/guest');
  return data;
};

export const logoutCurrentUser = async () => {
  const { data } = await apiClient.post('/auth/logout');
  return data;
};

export const fetchCurrentUser = async () => {
  const { data } = await apiClient.get('/auth/me');
  return data;
};

export const requestPasswordReset = async (payload) => {
  const { data } = await apiClient.post('/auth/forgot-password', payload);
  return data;
};

export const resetPasswordWithToken = async ({ token, password }) => {
  const { data } = await apiClient.post(`/auth/reset-password/${token}`, { password });
  return data;
};

export function getErrorMessage(error) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    if (message) return message;
    if (error.code === 'ERR_CANCELED') return 'Request stopped.';
    if (error.code === 'ERR_NETWORK') return 'Unable to reach the server.';
    if (status === 401) return 'Please sign in to continue.';
    if (status === 404) return 'API not found.';
    if (status === 429) return 'Too many requests. Please wait a moment and try again.';
    if (error.code === 'ECONNABORTED') return 'Request timeout.';
    return 'Server error.';
  }

  return error?.message || 'Network error.';
}
