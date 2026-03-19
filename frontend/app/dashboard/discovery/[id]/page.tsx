'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { fetchEvents, rsvpToEvent, cancelRsvp, getUserRsvps, type EventResponse } from '@/lib/api';
import { getSupabase } from '@/lib/supabase';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[500px] border border-gray-200 rounded-2xl bg-white">
      <div className="animate-pulse text-gray-400">Loading map...</div>
    </div>
  ),
});

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.id;
  const eventId = Number(rawId);

  const [event, setEvent] = useState<EventResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [hasRsvpd, setHasRsvpd] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpMessage, setRsvpMessage] = useState<string | null>(null);
  const [rsvpError, setRsvpError] = useState<string | null>(null);

  // Get current user ID
  useEffect(() => {
    getSupabase().auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUserId(data.session.user.id);
      }
    });
  }, []);

  // Fetch event details
  // TODO: Replace with dedicated GET /events/{id} endpoint to avoid fetching all events
  useEffect(() => {
    if (isNaN(eventId)) {
      setError('Invalid event ID');
      setLoading(false);
      return;
    }
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
    if (!userId || isNaN(eventId)) return;
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

    if (hasRsvpd) {
      // Cancel RSVP
      const prevEvent = event;
      if (event) {
        setHasRsvpd(false);
        setEvent({ ...event, attendee_count: Math.max(0, event.attendee_count - 1) });
      }
      try {
        const res = await cancelRsvp(eventId, userId);
        if (!res.ok && res.status !== 204) {
          setHasRsvpd(true);
          setEvent(prevEvent);
          setRsvpError('Unable to cancel RSVP. Please try again.');
          return;
        }
        setRsvpMessage('RSVP cancelled');
      } catch {
        setHasRsvpd(true);
        setEvent(prevEvent);
        setRsvpError('Unable to cancel RSVP. Please try again.');
      } finally {
        setRsvpLoading(false);
      }
      return;
    }

    // Create RSVP — optimistic update
    const prevHasRsvpd = hasRsvpd;
    const prevEvent = event;
    if (event) {
      setHasRsvpd(true);
      setEvent({ ...event, attendee_count: event.attendee_count + 1 });
    }

    try {
      const res = await rsvpToEvent(eventId, userId);
      if (!res.ok) {
        setHasRsvpd(prevHasRsvpd);
        setEvent(prevEvent);
        setRsvpError('Unable to RSVP. Please try again.');
        return;
      }
      setRsvpMessage("You're going!");
      setHasRsvpd(true);
    } catch {
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
        <Link href="/dashboard/discovery" className="text-orange-600 hover:text-orange-700 font-medium">
          Back to Discovery
        </Link>
      </div>
    );
  }

  const eventDate = new Date(event.start_time);
  const eventEndDate = new Date(String(event.end_time));
  const isFull = event.capacity > 0 && event.attendee_count >= event.capacity;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8 pt-24">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <h1 className="text-3xl font-bold" data-testid="event-title">{event.title}</h1>
          <i data-testid="society-name">{event.organizer}</i>

          <div className="space-y-3 mb-6 text-gray-600">
            <p data-testid="event-date">
              {eventDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              {' \u2022 '}
              {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {event.end_time && (
                <>
                  {' \u2014 '}
                  {eventEndDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  {' \u2022 '}
                  {eventEndDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </>
              )}
            </p>
          </div>

          {event.mood_tags && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Moods</h2>
              <ul className="text-gray-600" data-testid="event-mood">{event.mood_tags.join(", ")}</ul>
            </div>
          )}

          {event.energy_level && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Energy Level</h2>
              <p className="text-gray-600" data-testid="event-energy">{event.energy_level}</p>
            </div>
          )}

          {event.description && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-gray-600" data-testid="event-description">{event.description}</p>
            </div>
          )}

          <div className='mb-6'>
            <h2 className="text-lg font-semibold mb-2">Location</h2>
            <p className='mb-2 text-gray-600' data-testid="event-location">{event.location}</p>
            <MapView events={[event]} />
          </div>

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

            {isFull && !hasRsvpd ? (
              <button
                disabled
                data-testid="rsvp-button"
                className="w-full py-3 rounded-lg font-bold text-white bg-gray-400 cursor-not-allowed opacity-50"
              >
                Event Full
              </button>
            ) : (
              <button
                onClick={handleRsvp}
                disabled={rsvpLoading}
                data-testid="rsvp-button"
                className={`w-full py-3 rounded-lg font-bold text-white transition-colors disabled:opacity-50 ${
                  hasRsvpd
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {rsvpLoading
                  ? 'Processing...'
                  : hasRsvpd
                    ? <p>
                        Cancel RSVP
                        <br/>
                        {event.capacity > 0
                          ? `${event.attendee_count} / ${event.capacity} attending`
                          : `${event.attendee_count} attending`}
                      </p>
                    : <p>
                        RSVP
                        <br/>
                        {event.capacity > 0
                          ? `${event.attendee_count} / ${event.capacity} attending`
                          : `${event.attendee_count} attending`}
                      </p>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}