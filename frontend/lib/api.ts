'use client';

import { getToken } from './auth';

function resolveApiBaseUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, '');
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'NEXT_PUBLIC_API_URL is required in production. Set it in your Vercel environment variables.',
    );
  }

  return 'http://127.0.0.1:8000';
}

const API_BASE_URL = resolveApiBaseUrl();

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
  search?: string;
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
  if (params?.search) {
    qs.set('search', params.search);
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

export async function fetchOrganizerEvents(): Promise<Response> {
  return apiFetch('/api/organizer/events');
}

export async function updateEvent(eventId: number, data: Record<string, unknown>): Promise<Response> {
  return apiFetch(`/events/${eventId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function fetchEventRsvps(eventId: number): Promise<Response> {
  return apiFetch(`/api/events/${eventId}/rsvps`);
}

export async function deleteEvent(eventId: number): Promise<Response> {
  return apiFetch(`/events/${eventId}`, {method: 'DELETE'});
}

export async function rsvpToEvent(eventId: number, userId: string): Promise<Response> {
  return apiFetch('/api/rsvp', {
    method: 'POST',
    body: JSON.stringify({ event_id: eventId, user_id: userId }),
  });
}

export async function getUserRsvps(userId: string): Promise<Response> {
  return apiFetch(`/api/rsvp?user_id=${encodeURIComponent(userId)}`);
}

export async function cancelRsvp(eventId: number, userId: string): Promise<Response> {
  return apiFetch(`/events/${eventId}/rsvp`, {
    method: 'DELETE',
    body: JSON.stringify({ event_id: eventId, user_id: userId }),
  });
}

export async function createEvent(data: {
  title: string;
  date: string;
  location: string;
  capacity: number;
  organizer?: string;
  status?: string;
  mood_tags?: string[];
  energy_level?: string;
  description?: string;
}): Promise<Response> {
  return apiFetch('/events', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
