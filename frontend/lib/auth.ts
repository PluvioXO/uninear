'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const TOKEN_KEYS = ['access_token', 'token', 'refresh_token'];

let supabaseClient: SupabaseClient | null = null;

const getSupabaseClient = (): SupabaseClient => {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables.');
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return supabaseClient;
};

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
  const supabase = getSupabaseClient();

  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: options?.emailRedirectTo,
      data: options?.metadata,
    },
  });
};

export const login = async (email: string, password: string) => {
  const supabase = getSupabaseClient();

  return supabase.auth.signInWithPassword({ email, password });
};

export const logout = async (): Promise<void> => {
  const supabase = getSupabaseClient();

  await supabase.auth.signOut();
  clearAuthToken();

  if (typeof window !== 'undefined') {
    window.location.assign('/login');
  }
};

export const getToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;

  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getSession();

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
