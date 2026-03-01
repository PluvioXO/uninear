'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import MagneticButton from '@/components/MagneticButton';
import { fetchEvents, fetchUserRSVPs, type EventResponse, rsvpToEvent, updateUserProfile, uploadProfilePicture } from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[500px] border border-gray-200 rounded-2xl bg-white">
      <div className="animate-pulse text-gray-400">Loading map...</div>
    </div>
  ),
});

interface Event extends EventResponse {
  isRSVPd?: boolean;
}

interface MapEvent {
  id: number;
  title: string;
  location: string;
  start_time: string;
  latitude?: number;
  longitude?: number;
  attendee_count: number;
  capacity: number;
  status: string;
}

export default function StudentDashboard() {
  const { user } = useRequireAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: '', bio: '' });
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [allEvents, rsvps] = await Promise.all([
        fetchEvents(),
        fetchUserRSVPs(user.id)
      ]);

      const rsvpEventIds = new Set(rsvps.map((r: any) => r.event_id));

      setEvents(allEvents.map(e => ({
        ...e,
        isRSVPd: rsvpEventIds.has(e.id)
      })));
    } catch (err: any) {
      setError(err.message || 'Unable to load your dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (user) {
      setProfileForm({
        full_name: user.user_metadata?.full_name || '',
        bio: user.user_metadata?.bio || ''
      });
      if (user.user_metadata?.profile_picture_url) {
        setProfilePicture(user.user_metadata.profile_picture_url);
      }
    }
  }, [user]);

  const handleRSVP = async (eventId: number) => {
    setRsvpLoading(eventId);
    try {
      await rsvpToEvent(eventId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to RSVP. You might already be signed up.');
    } finally {
      setRsvpLoading(null);
    }
  };

  const handleSignOut = async () => {
    const { getSupabase } = await import('@/lib/supabase');
    const supabase = getSupabase();
    await supabase.auth.signOut();
  };

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPicture(true);
    try {
      const result = await uploadProfilePicture(file);
      setProfilePicture(result.url);

      // Save the URL to user metadata
      await updateUserProfile({ profile_picture_url: result.url });

      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err: any) {
      setSettingsError(err.message || 'Failed to upload profile picture');
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsError(null);

    try {
      await updateUserProfile(profileForm);
      setSettingsSuccess(true);
      setTimeout(() => {
        setSettingsSuccess(false);
        setShowSettings(false);
      }, 2000);
    } catch (err: any) {
      setSettingsError(err.message || 'Failed to save settings');
    } finally {
      setSettingsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const myEvents = events.filter(e => e.isRSVPd);
  const availableEvents = events.filter(e => !e.isRSVPd);

  // Extract unique societies from events
  const allSocieties = Array.from(new Set(events.map(e => e.organizer).filter(Boolean)));
  const joinedSocieties: string[] = []; // Not yet supported by backend DB

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 rounded-3xl p-8 w-full max-w-md relative shadow-xl">
            <button
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Settings</h2>

            {/* Profile Picture Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Profile Picture</label>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl border border-gray-200">
                  {profilePicture ? (
                    <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user?.user_metadata?.full_name?.charAt(0) || 'U'
                  )}
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    disabled={uploadingPicture}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPicture}
                    className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                  >
                    {uploadingPicture ? 'Uploading...' : 'Upload Photo'}
                  </button>
                </div>
              </div>
            </div>

            <form onSubmit={handleSettingsSave} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-orange-500 text-gray-900"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1">Bio</label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  rows={4}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-orange-500 text-gray-900 resize-none"
                  placeholder="Tell us about yourself"
                />
              </div>

              {settingsError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                  {settingsError}
                </div>
              )}

              {settingsSuccess && (
                <div className="p-3 bg-green-50 text-green-600 text-sm rounded-xl border border-green-100">
                  Settings saved successfully!
                </div>
              )}

              <button
                type="submit"
                disabled={settingsLoading}
                className="w-full px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {settingsLoading ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/50 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-bold tracking-tighter text-orange-600">UNINEAR</Link>
            <div className="hidden md:flex space-x-6 text-sm font-medium">
              <span className="text-gray-900 font-semibold">My Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSettings(true)}
              className="text-sm text-gray-500 hover:text-orange-600 transition-colors font-medium"
            >
              ⚙️ Settings
            </button>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.user_metadata?.full_name || 'Student'}</p>
              <button onClick={handleSignOut} className="text-xs text-gray-500 hover:text-orange-600 transition-colors">Sign out</button>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 border border-gray-200 flex items-center justify-center text-white font-bold hover:shadow-md transition-shadow cursor-pointer"
            >
              {profilePicture ? (
                <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user?.user_metadata?.full_name?.charAt(0) || 'U'
              )}
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 pt-28 pb-12">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome, {user?.user_metadata?.full_name?.split(' ')[0] || 'Student'}</h1>
          <p className="text-gray-400">Here is what is happening around campus.</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column: Events */}
          <div className="lg:col-span-2 space-y-10">
            {/* View Mode Toggle */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Your Events</h2>
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    viewMode === 'map' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Map
                </button>
              </div>
            </div>

            {/* Map View */}
            {viewMode === 'map' ? (
              <MapView events={events.map(e => ({
                id: e.id,
                title: e.title,
                location: e.location,
                start_time: e.start_time,
                latitude: e.latitude,
                longitude: e.longitude,
                attendee_count: e.attendee_count,
                capacity: e.capacity,
                status: e.status as any
              } as MapEvent))} />
            ) : (
            <>
            {/* My Events */}
            <div>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Events you have signed up for ({myEvents.length})
              </h2>
              {myEvents.length === 0 ? (
                <div className="p-8 text-center bg-white border border-gray-200 rounded-3xl shadow-sm">
                  <p className="text-gray-500">You haven&apos;t RSVP&apos;d to any events yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {myEvents.map(event => (
                    <div key={event.id} className="p-6 bg-white border border-gray-200 rounded-3xl shadow-sm flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{event.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{new Date(event.start_time).toLocaleString()} • {event.location}</p>
                        {event.organizer && <p className="text-xs text-orange-600 mt-2 font-medium">By {event.organizer}</p>}
                      </div>
                      <div className="px-4 py-2 bg-green-50 text-green-700 text-sm font-semibold rounded-xl border border-green-200">
                        Going
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available Events */}
            <div>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                Events you can join ({availableEvents.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableEvents.length === 0 && <p className="text-gray-500 col-span-2">No more events available right now.</p>}
                {availableEvents.map(event => (
                  <div key={event.id} className="p-6 bg-white border border-gray-200 rounded-3xl shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">{event.title}</h3>
                      <p className="text-xs text-gray-500 mb-4">{new Date(event.start_time).toLocaleString()} • {event.location}</p>
                    </div>
                    <div className="flex items-center justify-between mt-4 border-t border-gray-100 pt-4">
                      <span className="text-xs font-medium text-gray-600">{event.attendee_count} / {event.capacity} Spots</span>
                      <button 
                        onClick={() => handleRSVP(event.id)}
                        disabled={rsvpLoading === event.id || event.attendee_count >= event.capacity}
                        className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                      >
                        {rsvpLoading === event.id ? 'Loading...' : event.attendee_count >= event.capacity ? 'Full' : 'RSVP'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </>
            )}

          </div>

          {/* Sidebar: Societies */}
          <div className="space-y-8">
            {/* My Societies */}
            <div className="p-6 bg-white border border-gray-200 rounded-3xl shadow-sm">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Your Societies
              </h2>
              {joinedSocieties.length === 0 ? (
                <p className="text-sm text-gray-500">You haven&apos;t joined any societies yet.</p>
              ) : (
                <div className="space-y-3">
                  {joinedSocieties.map((soc, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">{soc.charAt(0)}</div>
                      <span className="text-sm font-medium text-gray-900">{soc}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available Societies */}
            <div className="p-6 bg-white border border-gray-200 rounded-3xl shadow-sm">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900">
                <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                Societies on UniNear
              </h2>
              {allSocieties.length === 0 ? (
                <p className="text-sm text-gray-500">No active societies found.</p>
              ) : (
                <div className="space-y-3">
                  {allSocieties.map((soc, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-xs">{String(soc).charAt(0)}</div>
                        <span className="text-sm font-medium text-gray-900">{soc}</span>
                      </div>
                      <button className="text-xs text-orange-600 font-medium hover:text-orange-700">Follow</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
