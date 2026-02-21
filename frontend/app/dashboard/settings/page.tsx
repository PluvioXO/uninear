'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import MagneticButton from '@/components/MagneticButton';
import { logout } from '@/lib/auth';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 overflow-x-hidden">
      {/* Dashboard Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/50 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-2xl font-bold tracking-tighter text-orange-600">UNINEAR</Link>
            <div className="hidden md:flex space-x-6 text-sm font-medium">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 transition-colors">Overview</Link>
              <Link href="/dashboard/events" className="text-gray-500 hover:text-gray-900 transition-colors">Events</Link>
              <Link href="/dashboard/members" className="text-gray-500 hover:text-gray-900 transition-colors">Members</Link>
              <Link href="/dashboard/analytics" className="text-gray-500 hover:text-gray-900 transition-colors">Analytics</Link>
              <Link href="/dashboard/settings" className="text-gray-900 font-semibold">Settings</Link>
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
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Settings</h1>
          <p className="text-gray-400">Manage your society profile, team, and preferences.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Tabs */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white border border-gray-200 rounded-3xl p-4 shadow-sm flex flex-col gap-1">
              {[
                { id: 'general', label: 'General', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' },
                { id: 'notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
                { id: 'team', label: 'Team Members', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-orange-50 text-orange-600'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} /></svg>
                  {tab.label}
                </button>
              ))}
              <div className="h-px bg-gray-100 my-2" />
               <button
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  Sign Out
                </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 space-y-6">
            
            {activeTab === 'general' && (
              <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-8">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Society Profile</h2>
                  <p className="text-sm text-gray-500">Update your society&apos;s public information.</p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 border-4 border-white shadow-md flex items-center justify-center text-3xl">
                    TS
                  </div>
                  <div>
                    <button className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors mb-2">Change Logo</button>
                    <p className="text-xs text-gray-400">JPG, GIF or PNG. 1MB max.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Society Name</label>
                      <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500" defaultValue="Tech Society" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
                      <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500" defaultValue="Main Campus" disabled />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea rows={4} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500" defaultValue="The biggest tech community on campus. We host hackathons, workshops, and social mixers." />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                      <input type="email" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500" defaultValue="hello@techsoc.edu" />
                    </div>
                     <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                      <input type="url" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500" defaultValue="https://techsoc.edu" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                   <MagneticButton
                    label="Save Changes"
                    className="bg-orange-600 text-white"
                    accentClassName="from-orange-400 via-amber-400 to-yellow-400"
                    type="button"
                  />
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-8">
                 <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Notification Preferences</h2>
                  <p className="text-sm text-gray-500">Manage how you receive updates.</p>
                </div>
                
                <div className="space-y-6">
                  {[
                    { title: 'New Event Signups', desc: 'Get notified when someone registers for an event.', checked: true },
                    { title: 'Weekly Digest', desc: 'A summary of your society\'s performance every Monday.', checked: true },
                    { title: 'Member Applications', desc: 'Alerts for new member requests.', checked: false },
                    { title: 'System Updates', desc: 'Important updates about the Uninear platform.', checked: true },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{item.title}</h3>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked={item.checked} />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
                 <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">Save Preferences</button>
                </div>
              </div>
            )}

            {activeTab === 'team' && (
               <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-8">
                 <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Team Members</h2>
                    <p className="text-sm text-gray-500">Manage access to your dashboard.</p>
                  </div>
                  <button className="text-sm bg-orange-50 text-orange-600 font-medium px-4 py-2 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors">
                    + Invite Member
                  </button>
                </div>

                <div className="overflow-hidden border border-gray-100 rounded-xl">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-6 py-3 font-medium">User</th>
                        <th className="px-6 py-3 font-medium">Role</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[
                        { name: 'Alex Thompson', email: 'alex@techsoc.edu', role: 'President', status: 'Active', color: 'bg-orange-500' },
                        { name: 'Sarah Chen', email: 'sarah@techsoc.edu', role: 'Event Lead', status: 'Active', color: 'bg-blue-500' },
                        { name: 'Marcus Rodriguez', email: 'marcus@techsoc.edu', role: 'Treasurer', status: 'Invited', color: 'bg-emerald-500' }
                      ].map((member, i) => (
                        <tr key={i}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full ${member.color} text-white flex items-center justify-center text-xs`}>
                                {member.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{member.name}</p>
                                <p className="text-xs text-gray-500">{member.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{member.role}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              member.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                            }`}>
                              {member.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <button className="text-gray-400 hover:text-gray-900">•••</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
               </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
