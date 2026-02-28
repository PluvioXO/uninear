'use client';

import { getSupabase } from '@/lib/supabase';

const TOKEN_KEYS = ['access_token', 'token', 'refresh_token'];

export const clearAuthToken = (): void => {
  if (typeof window === 'undefined') return;

  TOKEN_KEYS.forEach((key) => {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  });
};

export type SignupOptions = {
  emailRedirectTo?: string;
  metadata?: Record<string, string>;
};

export const signup = async (
  email: string,
  password: string,
  options?: SignupOptions,
) => {
  return getSupabase().auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: options?.emailRedirectTo,
      data: options?.metadata,
    },
  });
};

export const login = async (email: string, password: string) => {
  return getSupabase().auth.signInWithPassword({ email, password });
};

export const logout = async (): Promise<void> => {
  await getSupabase().auth.signOut();
  clearAuthToken();

  if (typeof window !== 'undefined') {
    window.location.assign('/login');
  }
};

export const getToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;

  const { data } = await getSupabase().auth.getSession();

  if (data.session?.access_token) {
    return data.session.access_token;
  }

  for (const key of TOKEN_KEYS) {
    const storageValue =
      window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
    if (storageValue) return storageValue;
  }

  return null;
};
