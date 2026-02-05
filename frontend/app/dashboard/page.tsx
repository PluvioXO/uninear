'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import MagneticButton from '@/components/MagneticButton';

// Types for our local data
interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
  attendees: number;
  capacity: number;
  status: 'Published' | 'Draft' | 'Scheduled' | 'Past';
  moods?: string[];
  energy?: 'Low' | 'Medium' | 'High';
  length?: string;
}

const INITIAL_EVENTS: Event[] = [
  {
    id: 1,
    title: 'Annual Tech Hackathon',
    date: '2025-10-15T09:00',
    location: 'Engineering Hub',
    attendees: 142,
    capacity: 200,
    status: 'Published',
    moods: ['Coding', 'Competition', 'Pizza'],
    energy: 'High',
    length: '24 hours'
  },
  {
    id: 2,
    title: 'Industry Panel Night',
    date: '2025-10-22T18:30',
    location: 'Main Auditorium',
    attendees: 89,
    capacity: 150,
    status: 'Draft',
    moods: ['Networking', 'Career', 'Talk'],
    energy: 'Medium',
    length: '2 hours'
  },
  {
    id: 3,
    title: 'Freshers Mixer',
    date: '2025-11-01T20:00',
    location: 'Student Union Bar',
    attendees: 45,
    capacity: 100,
    status: 'Scheduled',
    moods: ['Social', 'Drinks', 'Fun'],
    energy: 'High',
    length: '4 hours'
  },
  {
    id: 4,
    title: 'Last Year&apos;s Ball',
    date: '2024-12-15T19:00',
    location: 'Grand Hotel',
    attendees: 350,
    capacity: 350,
    status: 'Past',
    moods: ['Formal', 'Dance', 'Dinner'],
    energy: 'High',
    length: '6 hours'
  },
  {
    id: 5,
    title: 'Coffee Morning',
    date: '2024-11-10T10:00',
    location: 'Campus Cafe',
    attendees: 28,
    capacity: 40,
    status: 'Past',
    moods: ['Chill', 'Coffee', 'Chat'],
    energy: 'Low',
    length: '2 hours'
  },
  {
    id: 6,
    title: 'Guest Speaker: AI Ethics',
    date: '2024-10-05T14:00',
    location: 'Lecture Hall A',
    attendees: 180,
    capacity: 200,
    status: 'Past',
    moods: ['Educational', 'Tech', 'Talk'],
    energy: 'Medium',
    length: '1.5 hours'
  },
  {
    id: 7,
    title: 'Welcome Week BBQ',
    date: '2024-09-20T12:00',
    location: 'Campus Green',
    attendees: 280,
    capacity: 300,
    status: 'Past',
    moods: ['Social', 'Food', 'Outdoor'],
    energy: 'High',
    length: '3 hours'
  },
  {
    id: 8,
    title: 'Late Night Study',
    date: '2024-11-25T19:00',
    location: 'Library Group Room',
    attendees: 15,
    capacity: 20,
    status: 'Past',
    moods: ['Study', 'Quiet', 'Focus'],
    energy: 'Low',
    length: '4 hours'
  },
  {
    id: 9,
    title: 'Gaming Tournament',
    date: '2025-01-15T18:00',
    location: 'Student Union',
    attendees: 95,
    capacity: 100,
    status: 'Past',
    moods: ['Gaming', 'Competition', 'Fun'],
    energy: 'High',
    length: '5 hours'
  },
  {
    id: 10,
    title: 'Career Fair Prep',
    date: '2025-02-10T16:00',
    location: 'Seminar Room 4',
    attendees: 45,
    capacity: 60,
    status: 'Past',
    moods: ['Career', 'Workshop', 'Professional'],
    energy: 'Medium',
    length: '1.5 hours'
  },
  {
    id: 11,
    title: 'Spring Picnic',
    date: '2025-04-20T13:00',
    location: 'City Park',
    attendees: 120,
    capacity: 150,
    status: 'Past',
    moods: ['Outdoor', 'Social', 'Relaxed'],
    energy: 'Medium',
    length: '4 hours'
  },
  {
    id: 12,
    title: 'End of Year Gala',
    date: '2025-06-15T19:00',
    location: 'Grand Ballroom',
    attendees: 450,
    capacity: 500,
    status: 'Past',
    moods: ['Formal', 'Party', 'Celebration'],
    energy: 'High',
    length: '6 hours'
  },
  {
    id: 13,
    title: 'Alumni Networking',
    date: '2025-09-05T18:00',
    location: 'Innovation Hub',
    attendees: 75,
    capacity: 100,
    status: 'Past',
    moods: ['Networking', 'Career', 'Alumni'],
    energy: 'Medium',
    length: '3 hours'
  }
];

export default function DashboardPage() {
  const [events, setEvents] = useState<Event[]>(INITIAL_EVENTS);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Derived state for statistics
  const totalMembers = 1248; // Static for now
  const activeEventsCount = events.filter(e => e.status !== 'Past').length;
  const totalAttendees = events.reduce((acc, curr) => acc + curr.attendees, 0);
  const avgAttendance = Math.round(
    events.reduce((acc, curr) => acc + (curr.attendees / curr.capacity), 0) / events.length * 100
  );

  const filteredEvents = events.filter(e => 
    showPastEvents ? e.status === 'Past' : e.status !== 'Past'
  );

  const pastEvents = events.filter(e => e.status === 'Past').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 overflow-x-hidden">
      {/* Dashboard Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/50 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-2xl font-bold tracking-tighter text-blue-600">UNINEAR</Link>
            <div className="hidden md:flex space-x-6 text-sm font-medium">
              <Link href="/dashboard" className="text-gray-900">Overview</Link>
              <Link href="#" className="text-gray-500 hover:text-gray-900 transition-colors">Events</Link>
              <Link href="#" className="text-gray-500 hover:text-gray-900 transition-colors">Members</Link>
              <Link href="#" className="text-gray-500 hover:text-gray-900 transition-colors">Settings</Link>
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
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const newEvent: Event = {
                  id: Date.now(),
                  title: formData.get('title') as string,
                  date: formData.get('date') as string,
                  location: formData.get('location') as string,
                  attendees: 0,
                  capacity: Number(formData.get('capacity')),
                  status: 'Draft',
                  moods: (formData.get('moods') as string).split(',').map(s => s.trim()),
                  energy: formData.get('energy') as 'Low' | 'Medium' | 'High',
                  length: formData.get('length') as string
                };
                setEvents([...events, newEvent]);
                setIsCreateModalOpen(false);
              }} className="space-y-4">
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
                <div className="pt-4">
                  <MagneticButton
                    label="Create Event"
                    className="w-full bg-gray-900 text-white justify-center"
                    accentClassName="from-orange-400 via-amber-400 to-yellow-400"
                    type="submit"
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

        {/* Performance Overview */}
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            Performance Overview
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 border border-gray-200 rounded-3xl p-6 bg-white shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-6">Attendance Trend (Past Events)</h3>
              <div className="flex justify-between h-48 gap-4">
                {pastEvents.length === 0 ? (
                  <p className="text-gray-500 w-full text-center self-center">No past events data available.</p>
                ) : pastEvents.map((event) => (
                  <div key={event.id} className="flex flex-col items-center gap-2 flex-1 group h-full">
                    <div className="w-full bg-gray-100 rounded-t-lg relative flex-1 flex items-end overflow-hidden">
                      <div 
                        className="w-full bg-gradient-to-t from-orange-500 to-orange-600 transition-all duration-500 group-hover:opacity-80"
                        style={{ height: `${(event.attendees / event.capacity) * 100}%` }}
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded pointer-events-none whitespace-nowrap z-10">
                          {event.attendees} / {event.capacity}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 truncate w-full text-center">{new Date(event.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-gray-200 rounded-3xl p-6 bg-white shadow-sm flex flex-col justify-center">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Key Insights</h3>
              <ul className="space-y-4">
                <li className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">↑</div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Attendance Growth</p>
                    <p className="text-xs text-gray-500">Your events are seeing a 15% increase in attendance month-over-month.</p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">★</div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Top Category</p>
                    <p className="text-xs text-gray-500">&quot;Social&quot; events have the highest engagement rate (85%).</p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs">⚡</div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Peak Energy</p>
                    <p className="text-xs text-gray-500">High energy events retain attendees 20% longer.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upcoming Events */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                <span className={`w-2 h-2 ${showPastEvents ? 'bg-gray-500' : 'bg-orange-600'} rounded-full`}></span>
                {showPastEvents ? 'Past Events' : 'Upcoming Events'}
              </h2>
              <button 
                onClick={() => setShowPastEvents(!showPastEvents)}
                className="text-sm text-orange-600 hover:text-orange-500 transition-colors bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm"
              >
                {showPastEvents ? 'Show Upcoming' : 'Show Past'}
              </button>
            </div>
            
            <div className="space-y-4">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-12 border border-gray-200 rounded-2xl bg-white shadow-sm">
                  <p className="text-gray-500">No events found.</p>
                </div>
              ) : filteredEvents.map((event) => (
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
              ))}
            </div>
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
