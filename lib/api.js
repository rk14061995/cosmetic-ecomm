import axios from 'axios';
import { getAccessToken, getRefreshToken, persistAuthTokens, clearAuthTokens } from '@/lib/authTokens';

/**
 * Express mounts all routes under `/api`. Deployments often set only the origin
 * (missing `/api`), which produces exactly: GET /orders/... → 404 "Route not found".
 */
function normalizeApiBaseUrl(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  try {
    const u = new URL(trimmed);
    const path = (u.pathname || '/').replace(/\/+$/, '') || '/';
    if (path === '/') return `${u.origin}/api`;
    return `${u.origin}${path}`;
  } catch {
    return trimmed;
  }
}

const apiBase = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);

const api = axios.create({
  baseURL: apiBase,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = getRefreshToken();
        const { data } = await axios.post(`${apiBase}/auth/refresh-token`, { refreshToken });
        persistAuthTokens(data.accessToken, data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        clearAuthTokens();
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
