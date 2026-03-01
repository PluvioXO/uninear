'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import MagneticButton from '@/components/MagneticButton';
import { fetchEvents, type EventResponse } from '@/lib/api';

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
  location: string;
  attendees: number;
  capacity: number;
  status: 'Published' | 'Draft' | 'Scheduled' | 'Past';
  moods?: string[];
  energy?: 'Low' | 'Medium' | 'High';
  length?: string;
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
    location: e.location,
    attendees: e.attendee_count,
    capacity: e.capacity,
    status: (['Published', 'Draft', 'Scheduled', 'Past'].includes(e.status)
      ? e.status as Event['status']
      : 'Published'),
    latitude: e.latitude,
    longitude: e.longitude,
  };
}

export default function DashboardPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEvents();
      setEvents(data.map(toEvent));
    } catch {
      setError('Unable to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEvents(); }, []);

  // Derived state for statistics
  const totalMembers = 1248; // Static for now
  const activeEventsCount = events.length;
  const totalAttendees = events.reduce((acc, curr) => acc + curr.attendees, 0);
  const avgAttendance = events.length > 0
    ? Math.round(events.reduce((acc, curr) => acc + (curr.attendees / curr.capacity), 0) / events.length * 100)
    : 0;

  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const eventData = {
        title: formData.get('title') as string,
        date: formData.get('date') as string,
        location: formData.get('location') as string,
        capacity: Number(formData.get('capacity')),
        moods: (formData.get('moods') as string).split(',').map(s => s.trim()),
        energy: formData.get('energy') as 'Low' | 'Medium' | 'High',
        length: formData.get('length') as string
      };

      // TODO: Replace with actual API call
      // await createEvent(eventData);

      // For now, just add to local state
      const newEvent: Event = {
        id: Date.now(),
        ...eventData,
        attendees: 0,
        status: 'Draft'
      };

      setEvents([...events, newEvent]);
      setIsCreateModalOpen(false);
    } catch (error) {
      setCreateError('Failed to create event. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 overflow-x-hidden">
      {/* Dashboard Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/50 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-2xl font-bold tracking-tighter text-orange-600">UNINEAR</Link>
            <div className="hidden md:flex space-x-6 text-sm font-medium">
              <Link href="/dashboard" className="text-gray-900">Overview</Link>
              <Link href="/dashboard/events" className="text-gray-500 hover:text-gray-900 transition-colors">Events</Link>
              <Link href="/dashboard/members" className="text-gray-500 hover:text-gray-900 transition-colors">Members</Link>
              <Link href="/dashboard/analytics" className="text-gray-500 hover:text-gray-900 transition-colors">Analytics</Link>
              <Link href="/dashboard/settings" className="text-gray-500 hover:text-gray-900 transition-colors">Settings</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900">Tech Society</p>
              <p className="text-xs text-gray-500">President</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 border border-gray-200" />
          </div>
        </div>
      </nav>

      <main className="relative z-10 container mx-auto px-6 pt-28 pb-12">
        {/* Create Event Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white border border-gray-200 rounded-3xl p-8 w-full max-w-lg relative shadow-xl">
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-900"
              >
                ✕
              </button>
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Create New Event</h2>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Event Title</label>
                  <input name="title" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-orange-500 text-gray-900" placeholder="e.g. Annual Hackathon" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Date & Time</label>
                    <input name="date" type="datetime-local" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-orange-500 text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Location</label>
                    <input name="location" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-orange-500 text-gray-900" placeholder="e.g. Main Hall" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Capacity</label>
                    <input name="capacity" type="number" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-orange-500 text-gray-900" placeholder="100" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Length</label>
                    <input name="length" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-orange-500 text-gray-900" placeholder="e.g. 2 hours" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Energy Level</label>
                    <select name="energy" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-orange-500 text-gray-900">
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Mood Tags</label>
                    <input name="moods" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-orange-500 text-gray-900" placeholder="e.g. Social, Fun" />
                  </div>
                </div>
                {createError && (
                  <p className="text-red-600 text-sm">{createError}</p>
                )}
                <div className="pt-4">
                  <MagneticButton
                    label={isCreating ? 'Creating...' : 'Create Event'}
                    className="w-full bg-gray-900 text-white justify-center disabled:opacity-50"
                    accentClassName="from-orange-400 via-amber-400 to-yellow-400"
                    type="submit"
                    disabled={isCreating}
                  />
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-gray-400">Welcome back, here&apos;s what&apos;s happening with your society.</p>
          </div>
          <div onClick={() => setIsCreateModalOpen(true)} data-testid="create-event-trigger">
            <MagneticButton
              label="Create Event"
              className="bg-white text-black px-6"
              accentClassName="from-orange-400 via-amber-400 to-yellow-400"
              type="button"
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Total Members', value: totalMembers.toLocaleString(), change: '+12% this month', accent: 'bg-orange-100 text-orange-600' },
            { label: 'Active Events', value: activeEventsCount.toString(), change: 'Currently live', accent: 'bg-blue-100 text-blue-600' },
            { label: 'Total Attendees', value: totalAttendees.toLocaleString(), change: 'All time', accent: 'bg-emerald-100 text-emerald-600' },
            { label: 'Avg. Capacity', value: `${avgAttendance}%`, change: 'Across all events', accent: 'bg-pink-100 text-pink-600' }
          ].map((stat, i) => (
            <div key={i} className="border border-gray-200 rounded-3xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 ${stat.accent} rounded-full flex items-center justify-center`} />
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{stat.change}</span>
              </div>
              <p className="text-sm uppercase tracking-widest text-gray-500 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upcoming Events */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                <span className="w-2 h-2 bg-orange-600 rounded-full"></span>
                Upcoming Events
              </h2>
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
                  onClick={loadEvents}
                  className="px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-500 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : viewMode === 'map' ? (
              <MapView events={events} />
            ) : events.length === 0 ? (
              <div className="text-center py-12 border border-gray-200 rounded-2xl bg-white shadow-sm">
                <p className="text-gray-500">No upcoming events</p>
              </div>
            ) : <div className="space-y-4">{events.map((event) => (
                <div key={event.id} className="group border border-gray-200 rounded-2xl p-5 bg-white shadow-sm hover:shadow-md hover:border-orange-200 transition-all cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold mb-1 text-gray-900 group-hover:text-orange-600 transition-colors">{event.title}</h3>
                      <p className="text-sm text-gray-500 mb-3">
                        {new Date(event.date).toLocaleDateString()} • {new Date(event.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {event.location}
                      </p>
                      <div className="flex items-center gap-3 text-xs font-medium">
                        <span className={`px-2 py-1 rounded-md ${
                          event.status === 'Published' ? 'bg-emerald-100 text-emerald-700' :
                          event.status === 'Draft' ? 'bg-gray-100 text-gray-700' :
                          event.status === 'Past' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {event.status}
                        </span>
                        <span className="text-gray-500">
                          {event.attendees} / {event.capacity} registered
                        </span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-200 group-hover:bg-orange-50 group-hover:border-orange-100 transition-all">
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-4 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-orange-600" 
                      style={{ width: `${(event.attendees / event.capacity) * 100}%` }}
                    />
                  </div>
                </div>
              ))}</div>}
          </div>

          {/* Quick Actions & Notifications */}
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'New Post', icon: '📝' },
                  { label: 'Add Member', icon: '👤' },
                  { label: 'Scan Ticket', icon: '📱' },
                  { label: 'Export Data', icon: '📊' }
                ].map((action, i) => (
                  <button key={i} className="p-4 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-orange-200 transition-all text-left group">
                    <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">{action.icon}</span>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-orange-700">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
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
        </div>
      </main>
    </div>
  );
}
