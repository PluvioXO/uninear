'use client';

const TOKEN_KEYS = ['token', 'access_token', 'refresh_token'];

export const clearAuthToken = (): void => {
  if (typeof window === 'undefined') return;

  TOKEN_KEYS.forEach((key) => {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  });
};

export const logout = (): void => {
  clearAuthToken();

  if (typeof window !== 'undefined') {
    window.location.assign('/login');
  }
};
