'use client';

import React from 'react';
import Link from 'next/link';

const EVENTS = [
  {
    title: 'Annual Tech Hackathon',
    date: 'Oct 15, 2025',
    location: 'Engineering Hub',
    status: 'Published',
    attendees: '142 / 200',
  },
  {
    title: 'Industry Panel Night',
    date: 'Oct 22, 2025',
    location: 'Main Auditorium',
    status: 'Draft',
    attendees: '89 / 150',
  },
  {
    title: 'Freshers Mixer',
    date: 'Nov 1, 2025',
    location: 'Student Union Bar',
    status: 'Scheduled',
    attendees: '45 / 100',
  },
];

const STATUS_STYLES: Record<string, string> = {
  Published: 'bg-green-50 text-green-700',
  Draft: 'bg-gray-100 text-gray-600',
  Scheduled: 'bg-orange-50 text-orange-600',
};

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 overflow-x-hidden">
      <nav className="fixed top-0 w-full z-50 bg-white/50 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-2xl font-bold tracking-tighter text-orange-600">UNINEAR</Link>
            <div className="hidden md:flex space-x-6 text-sm font-medium">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 transition-colors">Overview</Link>
              <Link href="/dashboard/events" className="text-gray-900 font-semibold">Events</Link>
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
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Events</h1>
          <p className="text-gray-400">Track upcoming events and manage draft schedules.</p>
        </div>

        <div className="grid gap-6">
          {EVENTS.map((event) => (
            <div key={event.title} className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">{event.title}</h2>
                  <p className="text-sm text-gray-500">{event.date} • {event.location}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_STYLES[event.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {event.status}
                  </span>
                  <span className="text-sm text-gray-500">{event.attendees} attendees</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
