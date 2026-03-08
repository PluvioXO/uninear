'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchEvents, rsvpToEvent, getUserRsvps, type EventResponse } from '@/lib/api';
import { getSupabase } from '@/lib/supabase';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = Number(params.id);

  const [event, setEvent] = useState<EventResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [hasRsvpd, setHasRsvpd] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpMessage, setRsvpMessage] = useState<string | null>(null);
  const [rsvpError, setRsvpError] = useState<string | null>(null);

  // Get current user
  useEffect(() => {
    getSupabase().auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUserId(data.session.user.id);
      }
    });
  }, []);

  // Fetch event details
  useEffect(() => {
    async function loadEvent() {
      try {
        const events = await fetchEvents();
        const found = events.find(e => e.id === eventId);
        if (!found) {
          setError('Event not found');
          return;
        }
        setEvent(found);
      } catch {
        setError('Failed to load event details');
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [eventId]);

  // Check RSVP status
  const checkRsvpStatus = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await getUserRsvps(userId);
      if (res.ok) {
        const rsvps = await res.json();
        const found = rsvps.some((r: { event_id: number }) => r.event_id === eventId);
        setHasRsvpd(found);
      }
    } catch {
      // Silently fail — user just won't see RSVP status
    }
  }, [userId, eventId]);

  useEffect(() => {
    checkRsvpStatus();
  }, [checkRsvpStatus]);

  async function handleRsvp() {
    if (!userId) {
      router.push('/login');
      return;
    }

    setRsvpLoading(true);
    setRsvpError(null);
    setRsvpMessage(null);

    // Optimistic update
    const prevHasRsvpd = hasRsvpd;
    const prevEvent = event;
    if (!hasRsvpd && event) {
      setHasRsvpd(true);
      setEvent({ ...event, attendee_count: event.attendee_count + 1 });
    }

    try {
      const res = await rsvpToEvent(eventId, userId);
      if (!res.ok) {
        // Revert optimistic update
        setHasRsvpd(prevHasRsvpd);
        setEvent(prevEvent);
        setRsvpError('Unable to RSVP. Please try again.');
        return;
      }
      setRsvpMessage("You're going!");
      setHasRsvpd(true);
    } catch {
      // Revert optimistic update
      setHasRsvpd(prevHasRsvpd);
      setEvent(prevEvent);
      setRsvpError('Unable to RSVP. Please try again.');
    } finally {
      setRsvpLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading event...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-red-600">{error ?? 'Event not found'}</p>
        <Link href="/dashboard" className="text-orange-600 hover:text-orange-700 font-medium">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const eventDate = new Date(event.start_time);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8 pt-24">
      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 mb-6 inline-block">
          &larr; Back to Dashboard
        </Link>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <h1 className="text-3xl font-bold mb-4" data-testid="event-title">{event.title}</h1>

          <div className="space-y-3 mb-6 text-gray-600">
            <p data-testid="event-date">
              {eventDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              {' \u2022 '}
              {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p data-testid="event-location">{event.location}</p>
            <p data-testid="event-attendees">
              {event.capacity > 0
                ? `${event.attendee_count} / ${event.capacity} attending`
                : `${event.attendee_count} attending`}
            </p>
          </div>

          {event.description && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-2">About</h2>
              <p className="text-gray-600" data-testid="event-description">{event.description}</p>
            </div>
          )}

          {/* RSVP Section */}
          <div className="border-t border-gray-200 pt-6">
            {rsvpMessage && (
              <p className="text-green-600 font-medium mb-4" data-testid="rsvp-success">
                {rsvpMessage}
              </p>
            )}
            {rsvpError && (
              <p className="text-red-600 mb-4" data-testid="rsvp-error">
                {rsvpError}
              </p>
            )}

            <button
              onClick={handleRsvp}
              disabled={rsvpLoading || hasRsvpd}
              data-testid="rsvp-button"
              className={`w-full py-3 rounded-lg font-bold text-white transition-colors disabled:opacity-50 ${
                hasRsvpd
                  ? 'bg-gray-400 cursor-default'
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {rsvpLoading
                ? 'Processing...'
                : hasRsvpd
                  ? 'Cancel RSVP'
                  : 'RSVP'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
