'use client';

import { useRequireAuth } from '@/lib/useRequireAuth';
import Link from 'next/link';
import MagneticButton from '@/components/MagneticButton';

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useRequireAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Organiser Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/50 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-bold tracking-tighter text-orange-600">UNINEAR</Link>
            <div className="hidden md:flex space-x-6 text-sm font-medium">
              <Link href="/organizer/events" className="text-gray-500 hover:text-gray-900 transition-colors">Events</Link>
              <Link href="/organizer/members" className="text-gray-500 hover:text-gray-900 transition-colors">Members</Link>
              <Link href="/organizer/analytics" className="text-gray-500 hover:text-gray-900 transition-colors">Analytics</Link>
              <Link href="/organizer/settings" className="text-gray-500 hover:text-gray-900 transition-colors">Settings</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <MagneticButton
              label="Switch to Attendee View"
              href="/dashboard/discovery"
              className="bg-white text-black px-6"
              accentClassName="from-orange-400 via-amber-400 to-yellow-400"
              type="button"
            />
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900">PLACEHOLDER SOCIETY</p>
              <p className="text-xs text-gray-500">PLACEHOLDER ROLE</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 border border-gray-200" />
          </div>
        </div>
      </nav>
      {children}
    </div>
  )
}
