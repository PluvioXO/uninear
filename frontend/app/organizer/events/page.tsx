'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { fetchOrganizerEvents, updateEvent, deleteEvent, fetchEventRsvps } from '@/lib/api';
import RSVPList, { type RSVPAttendee } from '@/components/RSVPList';

interface OrganizerEvent {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
  location: string;
  capacity: number;
  attendee_count: number;
  status: string;
}

export default function OrganizerEventPage() {
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [confirmPublishId, setConfirmPublishId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [rsvpEventId, setRsvpEventId] = useState<number | null>(null);
  const [rsvpAttendees, setRsvpAttendees] = useState<RSVPAttendee[]>([]);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpError, setRsvpError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      const res = await fetchOrganizerEvents();
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.detail ?? 'Failed to load events');
        return;
      }
      const data = await res.json();
      setEvents(data);
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  async function handlePublish(eventId: number) {
    setPublishingId(eventId);
    try {
      const res = await updateEvent(eventId, { status: 'Published' });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.detail ?? 'Failed to publish event');
        return;
      }
      loadEvents();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setPublishingId(null);
      setConfirmPublishId(null);
    }
  }

  async function handleDelete(eventId: number) {
    setDeletingId(eventId);
    try {
      const res = await deleteEvent(eventId);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.detail ?? 'Failed to delete event');
        return;
      }
      loadEvents();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  async function loadRsvps(eventId: number) {
    setRsvpLoading(true);
    setRsvpError(null);
    setRsvpAttendees([]);
    try {
      const res = await fetchEventRsvps(eventId);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setRsvpError(body?.detail ?? 'Failed to load RSVPs');
        return;
      }
      const data = await res.json();
      setRsvpAttendees(data);
    } catch {
      setRsvpError('Network error. Please try again.');
    } finally {
      setRsvpLoading(false);
    }
  }

  async function handleViewRsvps(eventId: number) {
    if (rsvpEventId === eventId) {
      setRsvpEventId(null);
      return;
    }
    setRsvpEventId(eventId);
    loadRsvps(eventId);
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 overflow-x-hidden">
      <main className="relative z-10 container mx-auto px-6 pt-28 pb-12">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold">Your Events</h1>
            <p className="text-gray-400">View attendance and manage your events.</p>
          </div>
          <Link href="/organizer/events/create-event" className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            Create New Event
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
            <button onClick={() => setError(null)} className="ml-4 text-red-500 hover:text-red-700">Dismiss</button>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading your events...</div>
            ) : events.length === 0 ? (
              <div className="text-center py-12 border border-gray-200 rounded-xl bg-white shadow-sm">
                <p className="text-gray-500 mb-4">You haven&apos;t created any events yet.</p>
                <Link href="/organizer/events/create-event" className="text-orange-600 hover:text-orange-700 font-medium">
                  Create your first event
                </Link>
              </div>
            ) : (
              <div className="grid gap-6">
                {events.map((event) => (
                  <div key={event.id} className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="p-6 flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold mb-2">{event.title}</h2>
                        <p className="text-gray-500 mb-1">
                          {event.start_time
                            ? `${new Date(event.start_time).toLocaleDateString()} \u2022 ${new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                            : 'No date set'
                          } {'\u2022'} {event.location}
                        </p>
                        <p className="text-gray-500">
                          {event.capacity > 0
                            ? `${event.attendee_count} / ${event.capacity} attending`
                            : `${event.attendee_count} attending (unlimited)`}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleViewRsvps(event.id)}
                          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            rsvpEventId === event.id
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          data-testid={`view-rsvps-${event.id}`}
                        >
                          View RSVPs
                        </button>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          event.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {event.status}
                        </span>
                        {event.status === 'Draft' && (
                          confirmPublishId === event.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">Publish this event?</span>
                              <button
                                onClick={() => handlePublish(event.id)}
                                disabled={publishingId === event.id}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                              >
                                {publishingId === event.id ? 'Publishing...' : 'Confirm'}
                              </button>
                              <button
                                onClick={() => setConfirmPublishId(null)}
                                className="text-gray-500 hover:text-gray-700 text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmPublishId(event.id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                            >
                              Publish
                            </button>
                          )
                        )}
                        {confirmDeleteId === event.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Delete this event?</span>
                            <button
                              onClick={() => handleDelete(event.id)}
                              disabled={deletingId === event.id}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            >
                              {deletingId === event.id ? 'Deleting...' : 'Confirm'}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-gray-500 hover:text-gray-700 text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(event.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                            >
                              Delete
                            </button>
                          )
                        }
                      </div>
                    </div>
                    {rsvpEventId === event.id && (
                      <div className="border-t border-gray-200 p-6" data-testid={`rsvp-panel-${event.id}`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-400">Attendee list</span>
                          <button
                            onClick={() => loadRsvps(event.id)}
                            disabled={rsvpLoading}
                            className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                            data-testid={`refresh-rsvps-${event.id}`}
                          >
                            Refresh
                          </button>
                        </div>
                        <RSVPList attendees={rsvpAttendees} loading={rsvpLoading} error={rsvpError} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
              <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
              Recent Activity
            </h2>
            <div className="border border-gray-200 rounded-2xl bg-white shadow-sm p-1">
              {[
                { user: 'Sarah M.', action: 'registered for', target: 'Tech Hackathon', time: '2m ago' },
                { user: 'James L.', action: 'joined the society', target: '', time: '15m ago' },
                { user: 'Admin', action: 'updated event details', target: 'Panel Night', time: '1h ago' },
                { user: 'Alex K.', action: 'commented on', target: 'Freshers Mixer', time: '3h ago' }
              ].map((activity, i) => (
                <div key={i} className="p-3 hover:bg-gray-50 rounded-xl transition-colors border-b last:border-0 border-gray-100">
                  <p className="text-sm text-gray-600">
                    <span className="font-bold text-gray-900">{activity.user}</span> {activity.action} {activity.target && <span className="text-orange-600 font-medium">{activity.target}</span>}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
