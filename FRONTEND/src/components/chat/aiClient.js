import axios from "axios";

const AUTH_TOKEN_KEY = "mate_token";
const AUTH_USER_KEY = "mate_user";
const baseURL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

/* ================= AXIOS CLIENT ================= */

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* ================= TOKEN ATTACH ================= */

apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* ================= TOKEN SAVE ================= */

export const saveAuthToken = (token) => {
  if (!token || typeof window === 'undefined') return;

  localStorage.setItem(AUTH_TOKEN_KEY, token);
  document.cookie = `token=${token}; path=/;`;
};

export const saveAuthUser = (user) => {
  if (!user || typeof window === 'undefined') return;
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const getStoredAuthUser = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const value = localStorage.getItem(AUTH_USER_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    localStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
};

export const getAuthToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const isAuthenticated = () => Boolean(getAuthToken());

export const fetchCurrentUser = async () => {
  const { data } = await apiClient.get('/auth/me');
  saveAuthUser(data?.user);
  return data;
};

export const clearAuthToken = () => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  delete apiClient.defaults.headers.common.Authorization;
  document.cookie = "token=; Max-Age=0; path=/;";
};

/* ================= CHAT APIs ================= */

export const fetchChats = async () => {
  const { data } = await apiClient.get("/chat");
  return data;
};

export const createChat = async (title) => {
  const { data } = await apiClient.post("/chat", { title });
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

export const sendChatMessage = async ({ chatId, message, userId }) => {
  const payload = {
    chatId,
    message,
    ...(userId ? { userId } : {}),
  };
  const { data } = await apiClient.post('/chat/message', payload);
  return data;
};

export const updateChatMessage = async ({ messageId, content }) => {
  const { data } = await apiClient.put(`/chat/message/${messageId}`, { content });
  return data;
};

/* ================= AUTH APIs ================= */

export const loginUser = async (payload) => {
  const { data } = await apiClient.post("/auth/login", payload);
  saveAuthToken(data?.token);
  saveAuthUser(data?.user);
  return data;
};

export const registerUser = async (payload) => {
  const { data } = await apiClient.post("/auth/register", payload);
  return data;
};

export const createGuestSession = async () => {
  const { data } = await apiClient.post("/auth/guest");
  saveAuthToken(data?.token);
  saveAuthUser(data?.user);
  return data;
};

export const logoutUser = async () => {
  try {
    await apiClient.post('/auth/logout');
  } finally {
    clearAuthToken();
  }
};

export const forgotPassword = async (payload) => {
  const { data } = await apiClient.post('/auth/forgot-password', payload);
  return data;
};

export const resetPassword = async ({ token, password }) => {
  const { data } = await apiClient.post(`/auth/reset-password/${token}`, { password });
  return data;
};

export const submitContactForm = async (payload) => {
  const { data } = await apiClient.post('/contact', payload);
  return data;
};

/* ================= ERROR HANDLER ================= */

export function getErrorMessage(error) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    if (message) return message;
    if (status === 401) return "Session expired. Please login again.";
    if (status === 404) return "API not found";
    if (error.code === "ECONNABORTED") return "Request timeout";
    return "Server error";
  }

  return error?.message || "Network error";
}
