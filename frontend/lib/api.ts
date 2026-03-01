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
export async function fetchEvents(): Promise<EventResponse[]> {
  const res = await fetch(`${API_BASE_URL}/events`);
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

export async function fetchUserRSVPs(userId: string): Promise<any[]> {
  const res = await apiFetch(`/api/rsvp?user_id=${userId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch RSVPs: ${res.status}`);
  }
  return res.json();
}

export async function rsvpToEvent(eventId: number): Promise<any> {
  const res = await apiFetch(`/api/rsvp`, {
    method: 'POST',
    body: JSON.stringify({ event_id: eventId })
  });
  if (!res.ok) {
    throw new Error(`Failed to RSVP: ${res.status}`);
  }
  return res.json();
}

export async function updateUserProfile(userData: { full_name?: string; bio?: string; profile_picture_url?: string }): Promise<any> {
  const { getSupabase } = await import('@/lib/supabase');
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.updateUser({
    data: userData
  });

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }
  return data;
}

export async function uploadProfilePicture(file: File): Promise<{ url: string }> {
  const { getSupabase } = await import('@/lib/supabase');
  const supabase = getSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  const fileName = `${user.id}_${Date.now()}_${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from('profile-pictures')
    .upload(fileName, file, { upsert: true });

  if (uploadError) {
    throw new Error(`Failed to upload profile picture: ${uploadError.message}`);
  }

  const { data } = supabase.storage
    .from('profile-pictures')
    .getPublicUrl(fileName);

  return { url: data.publicUrl };
}
