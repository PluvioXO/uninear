'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { fetchEvents, type EventResponse, getUserRsvps, fetchRecentActivity, type ActivityItem } from '@/lib/api';
import { getSupabase } from '@/lib/supabase';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[500px] border border-gray-200 rounded-2xl bg-white">
      <div className="animate-pulse text-gray-400">Loading map...</div>
    </div>
  ),
});

// Types for our local data
interface Event {
  id: number;
  title: string;
  description?: string;
  date: string;
  end_date?: string;
  location: string;
  attendees: number;
  capacity: number;
  moods?: string[];
  energy?: 'Low' | 'Medium' | 'High';
  latitude?: number;
  longitude?: number;
}

/** Map API response to local Event shape */
function toEvent(e: EventResponse): Event {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    date: e.start_time,
    end_date: e.end_time,
    location: e.location,
    attendees: e.attendee_count,
    capacity: e.capacity,
    latitude: e.latitude,
    longitude: e.longitude,
  };
}

// Bath campus center as default location
const CAMPUS_LAT = 51.3758;
const CAMPUS_LNG = -2.3599;

export default function DiscoveryPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [radiusFilter, setRadiusFilter] = useState<number | null>(null);
  const [timeFilter, setTimeFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [rsvpdEvents, setRsvpdEvents] = useState<number[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadEvents = useCallback(async (radius?: number | null, time?: string | null, search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params: { lat?: number; lng?: number; radius_m?: number; time_filter?: '2hr' | 'today' | 'week'; search?: string } = {};
      if (radius != null) {
        params.lat = CAMPUS_LAT;
        params.lng = CAMPUS_LNG;
        params.radius_m = radius;
      }
      if (time) {
        params.time_filter = time as '2hr' | 'today' | 'week';
      }
      if (search) {
        params.search = search;
      }
      const data = await fetchEvents(Object.keys(params).length > 0 ? params : undefined);
      setEvents(data.map(toEvent));
    } catch {
      setError('Unable to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEvents(radiusFilter, timeFilter, activeSearch); }, [radiusFilter, timeFilter, activeSearch, loadEvents]);
  useEffect(() => { fetchRecentActivity().then(setActivity); }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Get current user
  useEffect(() => {
    getSupabase().auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUserId(data.session.user.id);
      }
    });
  }, []);

  //Check RSVP status of all events
  const checkRsvpStatus = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await getUserRsvps(userId);
      if (res.ok) {
        const rsvps = await res.json();
        setRsvpdEvents(rsvps.filter((r: { event_id: number }) => events.map(e => e.id).includes(r.event_id)).map((r: { event_id: number }) => r.event_id));
      }
    } catch {
      // Silently fail — user just won't see RSVP status
    }
  }, [userId, events]);

  useEffect(() => {
    checkRsvpStatus();
  }, [checkRsvpStatus]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setActiveSearch(value);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 overflow-x-hidden">
      <main className="relative z-10 container mx-auto px-6 pt-28 pb-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Discovery</h1>
            <p className="text-gray-400">Find the perfect event for you.</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upcoming Events */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Bar */}
            <div className="relative" data-testid="search-bar">
              <input
                type="text"
                data-testid="search-input"
                aria-label="Search events"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (debounceRef.current) clearTimeout(debounceRef.current);
                    setActiveSearch(searchQuery);
                  }
                }}
                className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-10 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 shadow-sm"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  type="button"
                  data-testid="search-clear"
                  aria-label="Clear search"
                  onClick={() => {
                    setSearchQuery('');
                    if (debounceRef.current) clearTimeout(debounceRef.current);
                    setActiveSearch('');
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                <span className="w-2 h-2 bg-orange-600 rounded-full"></span>
                Upcoming Events
              </h2>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex bg-gray-100 rounded-xl p-1" role="group" aria-label="Filter events by time" data-testid="time-filter">
                  {([
                    { label: 'All', value: '' },
                    { label: 'Next 2 hours', value: '2hr' },
                    { label: 'Today', value: 'today' },
                    { label: 'This week', value: 'week' },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTimeFilter(opt.value || null)}
                      data-testid={`time-filter-${opt.value || 'all'}`}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        (timeFilter ?? '') === opt.value
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <select
                  data-testid="radius-filter"
                  aria-label="Filter events by distance"
                  value={radiusFilter ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRadiusFilter(val === '' ? null : Number(val));
                  }}
                  className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-orange-500"
                >
                  <option value="">All distances</option>
                  <option value="100">Within 100m</option>
                  <option value="500">Within 500m</option>
                  <option value="1000">Within 1km</option>
                </select>
              <div className="flex bg-gray-100 rounded-xl p-1" data-testid="view-toggle">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  data-testid="view-toggle-list"
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    viewMode === 'map' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  data-testid="view-toggle-map"
                >
                  Map
                </button>
              </div>
              </div>
            </div>

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
                  onClick={() => loadEvents(radiusFilter, timeFilter)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-500 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : viewMode === 'map' ? (
              <MapView events={events} />
            ) : events.length === 0 ? (
              <div className="text-center py-12 border border-gray-200 rounded-2xl bg-white shadow-sm" data-testid="empty-state">
                <p className="text-gray-500">{activeSearch ? 'No events match your search' : 'No upcoming events'}</p>
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
                        {rsvpdEvents.includes(event.id) ? <span className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-700">RSVP'd!</span> : ''}
                        <span className={`${event.capacity > 0 && event.attendees >= event.capacity ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                          {event.capacity > 0 && event.attendees >= event.capacity
                            ? 'Event is full'
                            : event.capacity > 0
                              ? `${event.attendees} / ${event.capacity} registered`
                              : `${event.attendees} attending (unlimited)`}
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

          {/* Quick Actions & Notifications */}
          <div className="space-y-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
              <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
              Recent Activity
            </h2>
            <div className="border border-gray-200 rounded-2xl bg-white shadow-sm p-1">
              {activity.length === 0 ? (
                <div className="p-3 text-sm text-gray-400">No recent activity</div>
              ) : activity.map((item, i) => (
                <div key={i} className="p-3 hover:bg-gray-50 rounded-xl transition-colors border-b last:border-0 border-gray-100">
                  <p className="text-sm text-gray-600">
                    <span className="font-bold text-gray-900">{item.user}</span> {item.action} {item.target && <span className="text-orange-600 font-medium">{item.target}</span>}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{item.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}