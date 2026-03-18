'use client';

import { apiFetch } from '@/lib/api';

const MAX_SIZE = 1_048_576; // 1 MB

/**
 * Upload an avatar image via the backend and return the public URL.
 */
export async function uploadAvatar(file: File): Promise<string> {
  if (file.size > MAX_SIZE) {
    throw new Error('File must be under 1 MB');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  const formData = new FormData();
  formData.append('file', file);

  const res = await apiFetch('/auth/avatar', {
    method: 'POST',
    body: formData,
    headers: {}, // let browser set Content-Type with boundary
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail || 'Upload failed');
  }

  const data = await res.json();
  return data.avatar_url;
}
