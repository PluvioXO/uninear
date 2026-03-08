'use client';

import React from 'react';

export interface RSVPAttendee {
  user_id: string;
  name: string | null;
  email: string | null;
  rsvp_time: string;
}

interface RSVPListProps {
  attendees: RSVPAttendee[];
  loading: boolean;
  error: string | null;
}

export default function RSVPList({ attendees, loading, error }: RSVPListProps) {
  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500" data-testid="rsvp-loading">
        Loading RSVPs...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600" data-testid="rsvp-error">
        {error}
      </div>
    );
  }

  if (attendees.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500" data-testid="rsvp-empty">
        No RSVPs yet
      </div>
    );
  }

  return (
    <div data-testid="rsvp-list">
      <p className="text-sm font-medium text-gray-600 mb-4" data-testid="rsvp-count">
        RSVPs ({attendees.length})
      </p>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-200 text-sm text-gray-500">
            <th className="pb-2 font-medium">Name</th>
            <th className="pb-2 font-medium">Email</th>
            <th className="pb-2 font-medium">RSVP Time</th>
          </tr>
        </thead>
        <tbody>
          {attendees.map((attendee) => (
            <tr key={attendee.user_id} className="border-b border-gray-100 text-sm">
              <td className="py-3 text-gray-900">{attendee.name ?? 'Unknown'}</td>
              <td className="py-3 text-gray-600">{attendee.email ?? 'N/A'}</td>
              <td className="py-3 text-gray-500">
                {new Date(attendee.rsvp_time).toLocaleDateString()}{' '}
                {new Date(attendee.rsvp_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
