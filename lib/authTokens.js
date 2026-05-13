const ACCESS = 'accessToken';
const REFRESH = 'refreshToken';
/** Alias for access token — some tools / users expect a `jwt` key */
const JWT = 'jwt';

export function getAccessToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS) || localStorage.getItem(JWT);
}

export function getRefreshToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH);
}

export function persistAuthTokens(accessToken, refreshToken) {
  if (typeof window === 'undefined') return;
  if (accessToken) {
    localStorage.setItem(ACCESS, accessToken);
    localStorage.setItem(JWT, accessToken);
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH, refreshToken);
  }
}

export function clearAuthTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
  localStorage.removeItem(JWT);
}
