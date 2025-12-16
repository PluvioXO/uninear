'use client';

import React from 'react';
import Link from 'next/link';
import MagneticButton from '@/components/MagneticButton';
import SpotlightCard from '@/components/SpotlightCard';
import ReactBitsBeams from '@/components/ReactBitsBeams';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Background Effect */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ReactBitsBeams beamNumber={14} beamHeight={18} beamWidth={2.5} speed={2.2} />
      </div>

      {/* Dashboard Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-2xl font-bold tracking-tighter">UNINEAR</Link>
            <div className="hidden md:flex space-x-6 text-sm font-medium">
              <Link href="/dashboard" className="text-white">Overview</Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">Events</Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">Members</Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">Finances</Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">Settings</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-white">Tech Society</p>
              <p className="text-xs text-gray-400">President</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 border border-white/20" />
          </div>
        </div>
      </nav>

      <main className="relative z-10 container mx-auto px-6 pt-28 pb-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-gray-400">Welcome back, here's what's happening with your society.</p>
          </div>
          <MagneticButton
            label="Create Event"
            className="bg-white text-black px-6"
            accentClassName="from-purple-400 via-pink-400 to-blue-400"
            type="button"
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Total Members', value: '1,248', change: '+12% this month', accent: 'bg-purple-500' },
            { label: 'Active Events', value: '3', change: 'Next: Hackathon', accent: 'bg-blue-500' },
            { label: 'Ticket Sales', value: '$4,250', change: 'Last 30 days', accent: 'bg-emerald-500' },
            { label: 'Engagement', value: '84%', change: 'Avg. attendance', accent: 'bg-pink-500' }
          ].map((stat, i) => (
            <div key={i} className="border border-white/10 rounded-3xl p-6 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 ${stat.accent} rounded-full opacity-80`} />
                <span className="text-xs font-medium text-gray-400 bg-white/5 px-2 py-1 rounded-full">{stat.change}</span>
              </div>
              <p className="text-sm uppercase tracking-widest text-gray-400 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upcoming Events */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              Upcoming Events
            </h2>
            
            <div className="space-y-4">
              {[
                {
                  title: 'Annual Tech Hackathon',
                  date: 'Oct 15, 2025 • 09:00 AM',
                  location: 'Engineering Hub',
                  attendees: 142,
                  capacity: 200,
                  status: 'Published'
                },
                {
                  title: 'Industry Panel Night',
                  date: 'Oct 22, 2025 • 06:30 PM',
                  location: 'Main Auditorium',
                  attendees: 89,
                  capacity: 150,
                  status: 'Draft'
                },
                {
                  title: 'Freshers Mixer',
                  date: 'Nov 01, 2025 • 08:00 PM',
                  location: 'Student Union Bar',
                  attendees: 45,
                  capacity: 100,
                  status: 'Scheduled'
                }
              ].map((event, i) => (
                <div key={i} className="group border border-white/10 rounded-2xl p-5 bg-white/5 hover:border-purple-500/30 transition-all cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold mb-1 group-hover:text-purple-400 transition-colors">{event.title}</h3>
                      <p className="text-sm text-gray-400 mb-3">{event.date} • {event.location}</p>
                      <div className="flex items-center gap-3 text-xs font-medium">
                        <span className={`px-2 py-1 rounded-md ${
                          event.status === 'Published' ? 'bg-emerald-500/20 text-emerald-300' :
                          event.status === 'Draft' ? 'bg-gray-500/20 text-gray-300' :
                          'bg-blue-500/20 text-blue-300'
                        }`}>
                          {event.status}
                        </span>
                        <span className="text-gray-500">
                          {event.attendees} / {event.capacity} registered
                        </span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-purple-500/20 group-hover:border-purple-500/30 transition-all">
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-4 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500" 
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
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
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
                  <button key={i} className="p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-left">
                    <span className="text-2xl mb-2 block">{action.icon}</span>
                    <span className="text-sm font-medium text-gray-300">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                Recent Activity
              </h2>
              <div className="border border-white/10 rounded-2xl bg-white/5 p-1">
                {[
                  { user: 'Sarah M.', action: 'purchased a ticket', target: 'Tech Hackathon', time: '2m ago' },
                  { user: 'James L.', action: 'joined the society', target: '', time: '15m ago' },
                  { user: 'Admin', action: 'updated event details', target: 'Panel Night', time: '1h ago' },
                  { user: 'Alex K.', action: 'commented on', target: 'Freshers Mixer', time: '3h ago' }
                ].map((activity, i) => (
                  <div key={i} className="p-3 hover:bg-white/5 rounded-xl transition-colors">
                    <p className="text-sm text-gray-300">
                      <span className="font-bold text-white">{activity.user}</span> {activity.action} {activity.target && <span className="text-purple-300">{activity.target}</span>}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
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
