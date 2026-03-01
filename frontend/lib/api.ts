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

/** Fetch upcoming published events (public endpoint, no auth required). */
export async function fetchEvents(params?: {
  lat?: number;
  lng?: number;
  radius_m?: number;
  time_filter?: '2hr' | 'today' | 'week';
}): Promise<EventResponse[]> {
  let url = `${API_BASE_URL}/events`;
  const qs = new URLSearchParams();
  if (params?.lat != null && params?.lng != null && params?.radius_m != null) {
    qs.set('lat', String(params.lat));
    qs.set('lng', String(params.lng));
    qs.set('radius_m', String(params.radius_m));
  }
  if (params?.time_filter) {
    qs.set('time_filter', params.time_filter);
  }
  const qsStr = qs.toString();
  if (qsStr) {
    url += `?${qsStr}`;
  }
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch events: ${res.status}`);
  }
  return res.json();
}

export interface EventResponse {
  id: number;
  title: string;
  description?: string;
  location: string;
  start_time: string;
  capacity: number;
  attendee_count: number;
  status: string;
  organizer?: string;
  latitude?: number;
  longitude?: number;
}
