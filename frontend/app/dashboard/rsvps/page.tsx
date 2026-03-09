'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { fetchEvents, type EventResponse, getUserRsvps } from '@/lib/api';
import { getSupabase } from '@/lib/supabase';

// Types for our local data
interface RsvpdEvent {
  id: number;
  title: string;
  date: string;
  location: string;
  attendees: number;
  capacity: number;
  length?: string;
}

/** Map API response to local RsvpdEvent shape */
function toRsvpdEvent(e: EventResponse): RsvpdEvent {
  return {
    id: e.id,
    title: e.title,
    date: e.start_time,
    location: e.location,
    attendees: e.attendee_count,
    capacity: e.capacity,
    // length: e.length,
  };
}

export default function RsvpsPage() {
  const [events, setEvents] = useState<RsvpdEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user
  useEffect(() => {
    getSupabase().auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUserId(data.session.user.id);
      }
    });
  }, []);

  const loadRsvpdEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!userId) throw error;
      const resRsvps = await getUserRsvps(userId);
      const rsvps = await resRsvps.json();
      const resEvents = await fetchEvents();
      const data = resEvents.filter((r: { id: number }) => rsvps.some((r_: { event_id: number }) => r_.event_id === r.id));
      setEvents(data.map(toRsvpdEvent));
    } catch {
      setError('Unable to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadRsvpdEvents();
  }, [userId]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 overflow-x-hidden">
      <main className="relative z-10 container mx-auto px-6 pt-28 pb-12">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">My RSVPs</h1>
          <p className="text-gray-400">All of your RSVPs, in one place.</p>
        </div>

        <div>
          {loading ? (
            <div className="space-y-4" data-testid="loading-skeleton">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm animate-pulse">
                  <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
                  <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 border border-gray-200 rounded-2xl bg-white shadow-sm">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => loadRsvpdEvents()}
                className="px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-500 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 border border-gray-200 rounded-2xl bg-white shadow-sm" data-testid="empty-state">
              <p className="text-gray-500">You have not yet RSVPd to an event.</p>
              <Link href="/dashboard/discovery" className="text-orange-600 hover:text-orange-700 font-medium">
                Find an event in Discovery
              </Link>
            </div>
          ) : <div className="space-y-4">{events.map((event) => (
              <Link key={event.id} href={`/dashboard/discovery/${event.id}`} className="block group border border-gray-200 rounded-2xl p-5 bg-white shadow-sm hover:shadow-md hover:border-orange-200 transition-all cursor-pointer">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold mb-1 text-gray-900 group-hover:text-orange-600 transition-colors">{event.title}</h3>
                    <p className="text-sm text-gray-500 mb-3">
                      {new Date(event.date).toLocaleDateString()} • {new Date(event.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {event.location}
                    </p>
                    <div className="flex items-center gap-3 text-xs font-medium">
                      <span className={`${event.capacity > 0 && event.attendees >= event.capacity ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                        {event.capacity > 0 && event.attendees >= event.capacity
                          ? 'Event is full'
                          : event.capacity > 0
                            ? `${event.attendees} / ${event.capacity} registered`
                            : `${event.attendees} attending`}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-200 group-hover:bg-orange-50 group-hover:border-orange-100 transition-all">
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-400 group-hover:text-orange-600 transition-colors">View Details</span>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-4 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-600" 
                    style={{ width: `${event.capacity > 0 ? Math.min((event.attendees / event.capacity) * 100, 100) : 0}%` }}
                  />
                </div>
              </Link>
            ))}</div>}
        </div>
      </main>
    </div>
  );
}