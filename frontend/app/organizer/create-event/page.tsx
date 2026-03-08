'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createEvent } from '@/lib/api';

export default function CreateEventPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    organizer: '',
    capacity: '',
    description: '',
    moods: '',
    energy: 'Medium',
    length: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const dateTime = `${formData.date}T${formData.time}:00`;
      const res = await createEvent({
        title: formData.title,
        date: new Date(dateTime).toISOString(),
        location: formData.location,
        organizer: formData.organizer,
        capacity: Number(formData.capacity) || 0,
        description: formData.description || undefined,
        mood_tags: formData.moods ? formData.moods.split(',').map(s => s.trim()) : [],
        energy_level: formData.energy,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.detail ?? 'Failed to create event. Please try again.');
        return;
      }

      router.push('/organizer');
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8 pt-24">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/organizer" className="text-gray-500 hover:text-gray-900 mb-4 inline-block">← Back to Dashboard</Link>
          <h1 className="text-4xl font-bold">Create New Event</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-8 space-y-6 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Event Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="e.g. Annual Tech Hackathon"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-orange-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Time</label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-orange-500 transition-colors"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-orange-500 transition-colors"
                placeholder="e.g. Engineering Hub, Room 301"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Society Name</label>
              <input
                type="text"
                name="organizer"
                value={formData.organizer}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-orange-500 transition-colors"
                placeholder="e.g. Tech Society"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Capacity</label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-orange-500 transition-colors"
                placeholder="e.g. 100"
                min={0}
              />
              <p className="text-xs text-gray-400 mt-1">Leave blank for unlimited capacity</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Length</label>
              <input
                type="text"
                name="length"
                value={formData.length}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-orange-500 transition-colors"
                placeholder="e.g. 2 hours"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Energy Level</label>
              <select
                name="energy"
                value={formData.energy}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-orange-500 transition-colors"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Mood Tags</label>
              <input
                type="text"
                name="moods"
                value={formData.moods}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-orange-500 transition-colors"
                placeholder="e.g. Social, Fun (comma separated)"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="Describe your event..."
            />
          </div>

          {error && (
            <div className="fixed inset-0 flex items-center justify-center z-50">
              <div className="absolute inset-0 bg-black/20" />
              <div className="relative bg-white border border-gray-200 rounded-xl shadow-xl px-8 py-6 text-center max-w-sm mx-4">
                <p className="text-gray-900 font-semibold text-lg">That didn&apos;t work, try again</p>
                <p className="text-gray-500 text-sm mt-1">{error}</p>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="mt-4 text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {!error && isSubmitting && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm font-medium rounded-lg px-4 py-3">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Event created successfully! Redirecting...
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-orange-200 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
