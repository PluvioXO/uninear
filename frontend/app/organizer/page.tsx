'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function OrganizerDashboard() {
  const [events, setEvents] = useState([
    { id: 1, title: 'Annual Tech Hackathon', date: '2025-10-15', location: 'Engineering Hub', capacity: 200, status: 'Published' },
    { id: 2, title: 'Industry Panel Night', date: '2025-10-22', location: 'Main Auditorium', capacity: 150, status: 'Draft' },
  ]);

  return (
    <div className="min-h-screen bg-black text-white p-8 pt-24">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Organizer Dashboard</h1>
          <Link href="/organizer/create-event" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            Create New Event
          </Link>
        </div>

        <div className="grid gap-6">
          {events.map((event) => (
            <div key={event.id} className="bg-white/5 border border-white/10 rounded-xl p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold mb-2">{event.title}</h2>
                <p className="text-gray-400 mb-1">📅 {event.date} • 📍 {event.location}</p>
                <p className="text-gray-400">👥 Capacity: {event.capacity}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  event.status === 'Published' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {event.status}
                </span>
                <button className="text-gray-400 hover:text-white transition-colors">Edit</button>
                <button className="text-gray-400 hover:text-red-400 transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
