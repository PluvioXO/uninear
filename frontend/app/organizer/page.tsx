'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function OrganizerDashboard() {
  const [events] = useState([
    { id: 1, title: 'Annual Tech Hackathon', date: '2025-10-15', location: 'Engineering Hub', capacity: 200, status: 'Published' },
    { id: 2, title: 'Industry Panel Night', date: '2025-10-22', location: 'Main Auditorium', capacity: 150, status: 'Draft' },
  ]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8 pt-24">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Organizer Dashboard</h1>
          <Link href="/organizer/create-event" className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            Create New Event
          </Link>
        </div>

        <div className="grid gap-6">
          {events.map((event) => (
            <div key={event.id} className="bg-white border border-gray-200 rounded-xl p-6 flex justify-between items-center shadow-sm">
              <div>
                <h2 className="text-2xl font-bold mb-2">{event.title}</h2>
                <p className="text-gray-500 mb-1">📅 {event.date} • 📍 {event.location}</p>
                <p className="text-gray-500">👥 Capacity: {event.capacity}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  event.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {event.status}
                </span>
                <button className="text-gray-500 hover:text-gray-900 transition-colors">Edit</button>
                <button className="text-gray-500 hover:text-red-500 transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
