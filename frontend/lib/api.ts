'use client';

import { getToken } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Authenticated fetch wrapper that attaches Authorization: Bearer {token}
 * to all requests to the backend API.
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = await getToken();

  if (!token) {
    throw new Error('Not authenticated — no session token available');
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
}
