import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, Platform, Image, TouchableOpacity, Alert, TextInput, Dimensions, Modal, ScrollView, NativeModules } from 'react-native';

const SafeAreaView = View;
import * as Calendar from 'expo-calendar';

let MapView = null;
let Marker = null;
let Callout = null;
let PROVIDER_GOOGLE = null;

try {
  const ReactNativeMaps = require('react-native-maps');
  MapView = ReactNativeMaps.default;
  Marker = ReactNativeMaps.Marker;
  Callout = ReactNativeMaps.Callout;
  PROVIDER_GOOGLE = ReactNativeMaps.PROVIDER_GOOGLE;
} catch (mapModuleError) {
  console.warn('react-native-maps is unavailable in this native binary.', mapModuleError);
}

const resolveDevHostFromMetro = () => {
  const scriptURL = NativeModules?.SourceCode?.scriptURL;
  if (!scriptURL) return null;
  try {
    return new URL(scriptURL).hostname;
  } catch {
    return null;
  }
};

const resolveApiBaseUrl = () => {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, '');
  }

  const hostedFallback = 'https://uninear-gvjz.vercel.app';
  if (hostedFallback) {
    return hostedFallback;
  }

  const metroHost = resolveDevHostFromMetro();
  if (metroHost) {
    return `http://${metroHost}:8000`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }

  return 'http://localhost:8000';
};

const API_BASE_URL = resolveApiBaseUrl();

const DEFAULT_PROFILE = {
  name: 'User',
  email: '',
  avatar: 'https://ui-avatars.com/api/?name=Student+Member&background=ea580c&color=fff&size=128',
  bio: 'Tell people about yourself.',
  location: 'Bath, UK',
  interests: []
};

// Mock User Location (Bath, UK)
const USER_LOCATION = {
  latitude: 51.3782,
  longitude: -2.3264
};

// Seed societies — these also get created dynamically from event organisers
const SEED_SOCIETIES = [
  { id: 'bath-cs', name: 'Bath CS Society', description: 'Computing events, hackathons & talks.', avatar: 'https://ui-avatars.com/api/?name=CS+Society&background=ea580c&color=fff' },
  { id: 'bath-tech', name: 'Bath Tech Hub', description: 'Industry connections and workshops.', avatar: 'https://ui-avatars.com/api/?name=Tech+Hub&background=3b82f6&color=fff' },
  { id: 'bath-ents', name: 'Bath Ents', description: 'Social events and nights out.', avatar: 'https://ui-avatars.com/api/?name=Bath+Ents&background=f59e0b&color=fff' },
];

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180; // φ, λ in radians
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
};

export default function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [authUserId, setAuthUserId] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authPasswordVisible, setAuthPasswordVisible] = useState(false);
  const [authFullName, setAuthFullName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [eventScope, setEventScope] = useState('all'); // 'all' | 'rsvped' | 'attended'
  const [dateSortOrder, setDateSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [viewMode, setViewMode] = useState('list'); // 'list', 'map', 'filter'
  const [currentTab, setCurrentTab] = useState('events'); // 'events', 'friends', 'profile'
  const [selectedEvent, setSelectedEvent] = useState(null); // event detail modal
  
  // Profile State
  const [userProfile, setUserProfile] = useState(DEFAULT_PROFILE);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState(DEFAULT_PROFILE);
  const [profileTab, setProfileTab] = useState('info'); // 'info' | 'following'

  // Following State — set of society/organiser IDs
  const [followedIds, setFollowedIds] = useState(new Set(['bath-cs']));

  // Filter State
  const [showFilters, setShowFilters] = useState(false);
  const [radius, setRadius] = useState(null);
  const [timeRange, setTimeRange] = useState(null);
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [selectedEnergy, setSelectedEnergy] = useState(null);
  const [minRating, setMinRating] = useState(null);
  const [friends] = useState([]);
  const [rsvpEventIds, setRsvpEventIds] = useState(new Set());
  const [rsvpRecords, setRsvpRecords] = useState([]);
  const [rsvpLoadingIds, setRsvpLoadingIds] = useState(new Set());
  const [attendeesModalEvent, setAttendeesModalEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [attendeesError, setAttendeesError] = useState('');
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);

  useEffect(() => {
    if (!authToken) {
      setEvents([]);
      setRsvpEventIds(new Set());
      setRsvpRecords([]);
      setLoading(false);
      return;
    }
    fetchEvents(authToken);
  }, [authToken]);

  useEffect(() => {
    if (!authToken || !authUserId) return;
    fetchUserRsvps(authToken, authUserId);
  }, [authToken, authUserId]);

  const fetchEvents = async (token = authToken) => {
    try {
      if (!token) return;
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/events`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const text = await response.text();
        console.log('Error response:', text);
        throw new Error(`Failed to fetch events: ${response.status} ${text}`);
      }
      const data = await response.json();
      setEvents(data);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Unable to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const parseAuthResponse = (payload, fallbackEmail) => {
    const session = payload?.session || payload?.data?.session || null;
    const user = payload?.user || payload?.data?.user || session?.user || null;
    const accessToken = session?.access_token || payload?.access_token || payload?.data?.access_token || null;
    const userName = user?.user_metadata?.full_name || user?.full_name || fallbackEmail.split('@')[0];

    return {
      accessToken,
      userId: user?.id || null,
      profile: {
        name: userName,
        email: user?.email || fallbackEmail,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=ea580c&color=fff&size=128`,
        bio: 'Tell people about yourself.',
        location: 'Bath, UK',
        interests: [],
      },
    };
  };

  const getUserIdFromToken = (token) => {
    try {
      if (!token || typeof atob !== 'function') return null;
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      const decoded = atob(padded);
      const payload = JSON.parse(decoded);
      return payload?.sub || null;
    } catch {
      return null;
    }
  };

  const parseApiErrorDetail = (payload, fallbackMessage) => {
    if (!payload) return fallbackMessage;
    const detail = payload?.detail;
    if (typeof detail === 'string' && detail.trim().length > 0) return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0];
      if (typeof first?.msg === 'string') return first.msg;
      return 'Request validation failed';
    }
    if (typeof payload?.message === 'string' && payload.message.trim().length > 0) return payload.message;
    return fallbackMessage;
  };

  const submitLogin = async () => {
    setAuthError('');
    if (!isBathEmail(authEmail)) {
      setAuthError('Only @bath.ac.uk emails are allowed.');
      return;
    }
    if (!authPassword || authPassword.length < 8) {
      setAuthError('Password must be at least 8 characters.');
      return;
    }

    try {
      setAuthLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail.trim().toLowerCase(),
          password: authPassword,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.detail || 'Login failed');
      }

      const parsed = parseAuthResponse(payload, authEmail.trim().toLowerCase());
      if (!parsed.accessToken) {
        throw new Error('Login succeeded but no access token was returned.');
      }

      const resolvedUserId = parsed.userId || getUserIdFromToken(parsed.accessToken);
      setAuthToken(parsed.accessToken);
      setAuthUserId(resolvedUserId);
      setUserProfile(parsed.profile);
      setEditForm(parsed.profile);
      setCurrentTab('events');
      setViewMode('list');
      setAuthPassword('');
    } catch (err) {
      if (String(err?.message || '').toLowerCase().includes('network request failed')) {
        setAuthError(`Cannot reach API at ${API_BASE_URL}. Make sure FastAPI is running and reachable from this device.`);
      } else {
        setAuthError(err.message || 'Unable to log in.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const submitSignup = async () => {
    setAuthError('');
    if (!authFullName.trim()) {
      setAuthError('Full name is required.');
      return;
    }
    if (!isBathEmail(authEmail)) {
      setAuthError('Only @bath.ac.uk emails are allowed.');
      return;
    }
    if (!authPassword || authPassword.length < 8) {
      setAuthError('Password must be at least 8 characters.');
      return;
    }

    try {
      setAuthLoading(true);
      const signupResponse = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: authFullName.trim(),
          email: authEmail.trim().toLowerCase(),
          password: authPassword,
        }),
      });

      const signupPayload = await signupResponse.json();
      if (!signupResponse.ok) {
        throw new Error(signupPayload?.detail || 'Signup failed');
      }

      Alert.alert('Account created', 'Your account has been created. Logging you in now...');
      await submitLogin();
    } catch (err) {
      if (String(err?.message || '').toLowerCase().includes('network request failed')) {
        setAuthError(`Cannot reach API at ${API_BASE_URL}. Make sure FastAPI is running and reachable from this device.`);
      } else {
        setAuthError(err.message || 'Unable to create account.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const submitForgotPassword = async () => {
    setAuthError('');
    if (!isBathEmail(authEmail)) {
      setAuthError('Enter your @bath.ac.uk email first, then tap Forgot password.');
      return;
    }

    try {
      setAuthLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail.trim().toLowerCase(),
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.detail || payload?.message || 'Unable to send reset email');
      }

      Alert.alert(
        'Reset email sent',
        payload?.message || 'If that account exists, a password reset email has been sent.'
      );
    } catch (err) {
      if (String(err?.message || '').toLowerCase().includes('network request failed')) {
        setAuthError(`Cannot reach API at ${API_BASE_URL}. Make sure backend is running/redeployed.`);
      } else {
        setAuthError(err.message || 'Unable to send password reset email.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setAuthUserId(null);
    setEvents([]);
    setRsvpEventIds(new Set());
    setRsvpRecords([]);
    setAuthPassword('');
    setAuthMode('login');
    setEventScope('all');
    setCurrentTab('events');
    setViewMode('list');
  };

  const performDeleteAccount = async () => {
    if (!authToken) {
      Alert.alert('Not logged in', 'Please log in again.');
      return;
    }

    try {
      setDeleteAccountLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Delete account endpoint not found on server. Deploy backend changes first.');
        }
        throw new Error(parseApiErrorDetail(payload, 'Unable to delete account.'));
      }

      Alert.alert('Account deleted', 'Your account has been permanently deleted.');
      logout();
    } catch (err) {
      Alert.alert('Delete Account Error', err.message || 'Unable to delete your account right now.');
    } finally {
      setDeleteAccountLoading(false);
    }
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This permanently deletes your account and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'Are you absolutely sure you want to delete your account?',
              [
                { text: 'No', style: 'cancel' },
                { text: 'Yes, delete', style: 'destructive', onPress: performDeleteAccount },
              ]
            );
          },
        },
      ]
    );
  };

  const fetchUserRsvps = async (token = authToken, userId = authUserId) => {
    try {
      if (!token) return;
      const resolvedUserId = userId || getUserIdFromToken(token);
      if (!resolvedUserId) return;
      const response = await fetch(`${API_BASE_URL}/api/rsvp?user_id=${encodeURIComponent(resolvedUserId)}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        setRsvpEventIds(new Set());
        return;
      }
      const data = await response.json();
      setRsvpRecords(Array.isArray(data) ? data : []);
      const ids = new Set(
        (Array.isArray(data) ? data : [])
          .map((row) => row?.event_id)
          .filter((id) => typeof id === 'number')
      );
      setRsvpEventIds(ids);
    } catch (err) {
      setRsvpEventIds(new Set());
      setRsvpRecords([]);
    }
  };

  const handleRSVP = async (event) => {
    if (!authToken) {
      Alert.alert('Not logged in', 'Please log in again.');
      return;
    }
    const resolvedUserId = authUserId || getUserIdFromToken(authToken);
    if (!resolvedUserId) {
      Alert.alert('RSVP Error', 'Could not determine your user identity. Please log out and log in again.');
      return;
    }

    const eventId = event.id;
    const isAlreadyRsvped = rsvpEventIds.has(eventId);

    setRsvpLoadingIds((prev) => new Set(prev).add(eventId));
    try {
      if (isAlreadyRsvped) {
        const response = await fetch(`${API_BASE_URL}/events/${eventId}/rsvp`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            event_id: eventId,
            user_id: resolvedUserId,
          }),
        });

        if (!response.ok && response.status !== 204) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(parseApiErrorDetail(payload, 'Failed to cancel RSVP'));
        }

        setRsvpEventIds((prev) => {
          const next = new Set(prev);
          next.delete(eventId);
          return next;
        });
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId
              ? { ...e, attendee_count: Math.max(0, (e.attendee_count || 0) - 1) }
              : e
          )
        );
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          event_id: eventId,
          user_id: resolvedUserId,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const detail = parseApiErrorDetail(payload, 'Failed to RSVP');
        if (response.status === 409 && String(detail).toLowerCase().includes('already rsvp')) {
          setRsvpEventIds((prev) => new Set(prev).add(eventId));
          return;
        }
        throw new Error(detail);
      }

      setRsvpEventIds((prev) => new Set(prev).add(eventId));
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? { ...e, attendee_count: (e.attendee_count || 0) + 1 }
            : e
        )
      );
    } catch (err) {
      Alert.alert('RSVP Error', err.message || 'Unable to update RSVP right now.');
    } finally {
      setRsvpLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
    }
  };

  const openAttendees = async (event) => {
    if (!authToken) {
      Alert.alert('Not logged in', 'Please log in again.');
      return;
    }

    setAttendeesModalEvent(event);
    setAttendees([]);
    setAttendeesError('');
    setAttendeesLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/events/${event.id}/rsvps`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.detail || `Failed to load attendees (${response.status})`);
      }

      const data = await response.json();
      setAttendees(Array.isArray(data) ? data : []);
    } catch (err) {
      setAttendeesError(err.message || 'Unable to load attendees right now.');
    } finally {
      setAttendeesLoading(false);
    }
  };

  const toggleMood = (mood) => {
    if (selectedMoods.includes(mood)) {
      setSelectedMoods(selectedMoods.filter(m => m !== mood));
    } else {
      setSelectedMoods([...selectedMoods, mood]);
    }
  };

  const matchesSearchQuery = (event) => {
    if (searchQuery.trim().length === 0) return true;
    const q = searchQuery.toLowerCase();
    return (
      (event.title || '').toLowerCase().includes(q) ||
      (event.location || '').toLowerCase().includes(q) ||
      (event.organizer || '').toLowerCase().includes(q) ||
      (event.description || '').toLowerCase().includes(q)
    );
  };

  const filteredEvents = events.filter(event => {
    if (!matchesSearchQuery(event)) return false;

    // Radius Filter
    if (radius && event.latitude && event.longitude) {
      const dist = getDistance(USER_LOCATION.latitude, USER_LOCATION.longitude, event.latitude, event.longitude);
      if (dist > radius) return false;
    }

    // Time Filter
    if (timeRange) {
      const eventDate = new Date(event.start_time || event.date);
      const now = new Date();
      const diffHours = (eventDate - now) / (1000 * 60 * 60);
      const isToday = eventDate.getDate() === now.getDate() && eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
      
      if (timeRange === 'now' && diffHours > 0.5) return false;
      if (timeRange === '1hr' && diffHours > 1) return false;
      if (timeRange === '2hr' && diffHours > 2) return false;
      if (timeRange === 'today' && !isToday) return false;
      if (timeRange === 'week' && diffHours > 24 * 7) return false;
    }

    // Mood Filter
    if (selectedMoods.length > 0) {
      if (!event.moods || !event.moods.some(m => selectedMoods.includes(m))) return false;
    }

    // Energy Filter
    if (selectedEnergy && event.energy_level !== selectedEnergy) return false;

    // Rating Filter
    if (minRating && (event.rating || 0) < minRating) return false;

    return true;
  });

  const pastAttendedEvents = (() => {
    const byId = new Map();
    const nowTs = Date.now();
    (Array.isArray(rsvpRecords) ? rsvpRecords : []).forEach((row) => {
      const event = row?.event ? { ...row.event, id: row.event.id ?? row.event_id } : null;
      if (!event || typeof event.id !== 'number') return;
      const eventTs = new Date(event.start_time || event.date).getTime();
      if (!Number.isFinite(eventTs) || eventTs >= nowTs) return;
      if (!matchesSearchQuery(event)) return;
      byId.set(event.id, event);
    });
    return Array.from(byId.values()).sort(
      (a, b) => new Date(b.start_time || b.date).getTime() - new Date(a.start_time || a.date).getTime()
    );
  })();

  const scopedEvents =
    eventScope === 'rsvped'
      ? filteredEvents.filter((event) => rsvpEventIds.has(event.id))
      : eventScope === 'attended'
        ? pastAttendedEvents
        : filteredEvents;

  const sortedScopedEvents = [...scopedEvents].sort((a, b) => {
    const aTs = new Date(a.start_time || a.date).getTime();
    const bTs = new Date(b.start_time || b.date).getTime();
    return dateSortOrder === 'asc' ? aTs - bTs : bTs - aTs;
  });

  const activeFilterCount = [
    radius !== null,
    timeRange !== null,
    selectedMoods.length > 0,
    selectedEnergy !== null,
    minRating !== null,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setRadius(null);
    setTimeRange(null);
    setSelectedMoods([]);
    setSelectedEnergy(null);
    setMinRating(null);
  };

  // Build a deduplicated society list from seed + live event organisers
  const allSocieties = (() => {
    const map = new Map(SEED_SOCIETIES.map(s => [s.id, s]));
    events.forEach(e => {
      if (e.organizer) {
        const id = e.organizer.toLowerCase().replace(/\s+/g, '-');
        if (!map.has(id)) {
          map.set(id, {
            id,
            name: e.organizer,
            description: 'Society on Uninear.',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(e.organizer)}&background=ea580c&color=fff`,
          });
        }
      }
    });
    return Array.from(map.values());
  })();

  const toggleFollow = (societyId) => {
    setFollowedIds(prev => {
      const next = new Set(prev);
      if (next.has(societyId)) {
        next.delete(societyId);
      } else {
        next.add(societyId);
      }
      return next;
    });
  };

  const followedSocieties = allSocieties.filter(s => followedIds.has(s.id));

  const renderFriendItem = ({ item }) => (
    <View style={styles.friendCard}>
      <Image source={{ uri: item.avatar }} style={styles.friendAvatar} />
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.name}</Text>
        <Text style={styles.friendStatus}>{item.status}</Text>
      </View>
      <TouchableOpacity style={styles.messageButton}>
        <Text style={styles.messageButtonText}>Message</Text>
      </TouchableOpacity>
    </View>
  );

  function isBathEmail(email) {
    return /^[^@\s]+@bath\.ac\.uk$/i.test(email);
  }
  const isProfileSaveDisabled = !isBathEmail(editForm.email);

  const saveProfile = () => {
    if (!isBathEmail(editForm.email)) {
      Alert.alert('Invalid Email', 'Only @bath.ac.uk emails are allowed');
      return;
    }

    setUserProfile(editForm);
    setIsEditingProfile(false);
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const renderProfile = () => (
    <ScrollView contentContainerStyle={styles.profileContainer}>
      <View style={styles.profileHeader}>
        <Image source={{ uri: userProfile.avatar }} style={styles.profileAvatar} />
        <TouchableOpacity style={styles.editAvatarButton}>
          <Text style={styles.editAvatarText}>Change Photo</Text>
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{events.length}</Text>
          <Text style={styles.statLabel}>Events</Text>
        </View>
        <View style={styles.statDivider} />
        <TouchableOpacity style={styles.statItem} onPress={() => setProfileTab('following')}>
          <Text style={styles.statNumber}>{followedIds.size}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </TouchableOpacity>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{friends.length}</Text>
          <Text style={styles.statLabel}>Friends</Text>
        </View>
      </View>

      {/* Profile sub-tabs */}
      <View style={styles.profileTabs}>
        {['info', 'following'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.profileTabBtn, profileTab === tab && styles.profileTabBtnActive]}
            onPress={() => setProfileTab(tab)}
          >
            <Text style={[styles.profileTabText, profileTab === tab && styles.profileTabTextActive]}>
              {tab === 'info' ? 'Profile' : `Following (${followedIds.size})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {profileTab === 'following' ? (
        /* ── Following list ── */
        followedSocieties.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🏛️</Text>
            <Text style={styles.emptyStateText}>You're not following any societies yet.</Text>
            <Text style={styles.emptyStateSubText}>Tap "+ Follow" on any event card to follow that society.</Text>
          </View>
        ) : (
          <View>
            {followedSocieties.map(society => {
              const upcomingCount = events.filter(e =>
                e.organizer &&
                e.organizer.toLowerCase().replace(/\s+/g, '-') === society.id
              ).length;
              return (
                <View key={society.id} style={styles.societyCard}>
                  <Image source={{ uri: society.avatar }} style={styles.societyAvatar} />
                  <View style={styles.societyInfo}>
                    <Text style={styles.societyName}>{society.name}</Text>
                    <Text style={styles.societyDesc} numberOfLines={1}>{society.description}</Text>
                    {upcomingCount > 0 && (
                      <Text style={styles.societyEvents}>{upcomingCount} event{upcomingCount !== 1 ? 's' : ''}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.unfollowButton}
                    onPress={() => toggleFollow(society.id)}
                  >
                    <Text style={styles.unfollowButtonText}>Unfollow</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )
      ) : (
        /* ── Profile info / edit ── */
        isEditingProfile ? (
        <View style={styles.editForm}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={editForm.name}
            onChangeText={(text) => setEditForm({...editForm, name: text})}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.inputReadOnly]}
            value={editForm.email}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={false}
            selectTextOnFocus={false}
          />
          <Text style={styles.helperText}>Email is managed by your account and cannot be changed here.</Text>

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={editForm.bio}
            onChangeText={(text) => setEditForm({...editForm, bio: text})}
            multiline
          />

          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={editForm.location}
            onChangeText={(text) => setEditForm({...editForm, location: text})}
          />

          <Text style={styles.label}>Interests (comma separated)</Text>
          <TextInput
            style={styles.input}
            value={editForm.interests.join(', ')}
            onChangeText={(text) => setEditForm({...editForm, interests: text.split(',').map(i => i.trim())})}
          />

          <View style={styles.editButtons}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setEditForm(userProfile);
                setIsEditingProfile(false);
              }}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.saveButton, isProfileSaveDisabled && styles.saveButtonDisabled]}
              onPress={saveProfile}
              disabled={isProfileSaveDisabled}
            >
              <Text style={[styles.buttonText, styles.saveButtonText]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{userProfile.name}</Text>
          <Text style={styles.profileEmail}>{userProfile.email}</Text>
          
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{userProfile.bio}</Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Location</Text>
            <Text style={styles.locationText}>📍 {userProfile.location}</Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.interestsContainer}>
              {userProfile.interests.map((interest, index) => (
                <View key={index} style={styles.interestTag}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => {
              setEditForm(userProfile);
              setIsEditingProfile(true);
            }}
          >
            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <TouchableOpacity
              style={[styles.deleteAccountButton, deleteAccountLoading && styles.deleteAccountButtonDisabled]}
              onPress={confirmDeleteAccount}
              disabled={deleteAccountLoading}
            >
              <Text style={styles.deleteAccountButtonText}>
                {deleteAccountLoading ? 'Deleting account...' : 'Delete Account'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )
      )}
    </ScrollView>
  );

  const addToCalendar = async (event) => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status === 'granted') {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        const defaultCalendar = calendars.find(c => c.isPrimary) || calendars[0];
        
        if (defaultCalendar) {
          const startDate = new Date(event.start_time || event.date);
          const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours

          await Calendar.createEventAsync(defaultCalendar.id, {
            title: event.title,
            startDate,
            endDate,
            location: event.location,
            notes: event.description || `Hosted by ${event.organizer}`,
          });
          Alert.alert('Success', 'Event added to your calendar!');
        } else {
          Alert.alert('Error', 'No calendar found on device.');
        }
      } else {
        Alert.alert('Permission Denied', 'Calendar permission is required to add events.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to add event to calendar.');
    }
  };

  const renderEventItem = ({ item }) => {
    const societyId = item.organizer ? item.organizer.toLowerCase().replace(/\s+/g, '-') : null;
    const isFollowing = societyId ? followedIds.has(societyId) : false;
    const isRsvped = rsvpEventIds.has(item.id);
    const isRsvpLoading = rsvpLoadingIds.has(item.id);
    const isPastEvent = new Date(item.start_time || item.date).getTime() < Date.now();

    return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.title}>{item.title}</Text>
        {item.rating && (
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>★ {item.rating}</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.date}>{new Date(item.start_time || item.date).toLocaleDateString()} • {new Date(item.start_time || item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
      <Text style={styles.location}>{item.location}</Text>

      {item.organizer && (
        <View style={styles.organizerRow}>
          <Text style={styles.organizer}>Hosted by {item.organizer}</Text>
          {societyId && (
            <TouchableOpacity
              style={[styles.followChip, isFollowing && styles.followChipActive]}
              onPress={() => toggleFollow(societyId)}
            >
              <Text style={[styles.followChipText, isFollowing && styles.followChipTextActive]}>
                {isFollowing ? '✓ Following' : '+ Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      <View style={styles.tagsContainer}>
        {item.energy_level && (
          <View style={[styles.tag, styles.energyTag]}>
            <Text style={styles.tagText}>{item.energy_level.toUpperCase()}</Text>
          </View>
        )}
        {item.moods && item.moods.map((mood, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{mood}</Text>
          </View>
        ))}
      </View>

      {item.friends_attending && item.friends_attending.length > 0 && (
        <Text style={styles.friendsText}>
          👥 {item.friends_attending.length} friends going: {item.friends_attending.join(', ')}
        </Text>
      )}

      <View style={styles.attendanceRow}>
        <Text style={styles.attendanceText}>
          👥 {(item.attendee_count || 0)} / {(item.capacity || 0)} attending
        </Text>
        <TouchableOpacity
          style={styles.inviteChip}
          onPress={() => openAttendees(item)}
        >
          <Text style={styles.inviteChipText}>People</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.calendarButton}
          onPress={() => addToCalendar(item)}
        >
          <Text style={styles.calendarButtonText}>Add to Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.rsvpButton,
            (isRsvped || isPastEvent) && styles.rsvpButtonSecondary,
          ]}
          onPress={() => handleRSVP(item)}
          disabled={isRsvpLoading || isPastEvent}
        >
          <Text style={[styles.rsvpButtonText, (isRsvped || isPastEvent) && styles.rsvpButtonSecondaryText]}>
            {isPastEvent ? 'Attended' : isRsvpLoading ? 'Please wait...' : isRsvped ? 'Cancel RSVP' : 'RSVP'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  };

  if (!authToken) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authContainer}>
          <Text style={styles.authTitle}>UniNear</Text>
          <Text style={styles.authSubtitle}>
            {authMode === 'login' ? 'Log in to continue' : 'Create your account'}
          </Text>

          {authMode === 'signup' && (
            <>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={authFullName}
                onChangeText={setAuthFullName}
                placeholder="Your full name"
                autoCapitalize="words"
              />
            </>
          )}

          <Text style={styles.label}>Bath Email</Text>
          <TextInput
            style={styles.input}
            value={authEmail}
            onChangeText={setAuthEmail}
            placeholder="you@bath.ac.uk"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              value={authPassword}
              onChangeText={setAuthPassword}
              placeholder="Minimum 8 characters"
              secureTextEntry={!authPasswordVisible}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.passwordToggleButton}
              onPress={() => setAuthPasswordVisible(prev => !prev)}
            >
              <Text style={styles.passwordToggleText}>
                {authPasswordVisible ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
          </View>

          {authMode === 'login' && (
            <TouchableOpacity onPress={submitForgotPassword} disabled={authLoading}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>
          )}

          {authError.length > 0 && <Text style={styles.errorText}>{authError}</Text>}

          <TouchableOpacity
            style={[styles.authButton, authLoading && styles.authButtonDisabled]}
            onPress={authMode === 'login' ? submitLogin : submitSignup}
            disabled={authLoading}
          >
            <Text style={styles.authButtonText}>
              {authLoading ? 'Please wait...' : authMode === 'login' ? 'Log In' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setAuthError('');
              setAuthMode(authMode === 'login' ? 'signup' : 'login');
            }}
          >
            <Text style={styles.authToggleText}>
              {authMode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Unable to load events. Please try again.</Text>
        <Text style={styles.retry} onPress={fetchEvents}>Tap to retry</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{userProfile.name}</Text>
          </View>
          <View style={styles.headerActions}>
            <Image source={{ uri: userProfile.avatar }} style={styles.avatar} />
            <TouchableOpacity onPress={logout} style={styles.logoutButton}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.controls}>
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchBar}
              placeholder="Search by name, location, organiser..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                // Auto-switch to list when user starts typing
                if (text.length > 0 && viewMode !== 'list') setViewMode('list');
              }}
              returnKeyType="search"
              clearButtonMode="never"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClearButton}>
                <Text style={styles.searchClearText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          {searchQuery.trim().length > 0 && (
            <Text style={styles.searchResultCount}>
              {sortedScopedEvents.length} result{sortedScopedEvents.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot;
            </Text>
          )}
        </View>

        {/* View mode segmented control */}
        <View style={styles.segmentedControl}>
          {[
            { key: 'list', label: '☰  List' },
            { key: 'map',  label: '🗺  Map'  },
            { key: 'filter', label: `⚙  Filter${activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}` },
          ].map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.segmentButton, viewMode === key && styles.segmentButtonActive]}
              onPress={() => setViewMode(key)}
            >
              <Text style={[styles.segmentText, viewMode === key && styles.segmentTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {currentTab === 'events' && (
          <>
            <View style={styles.scopeControl}>
              {[
                { key: 'all', label: 'All' },
                { key: 'rsvped', label: 'My RSVPs' },
                { key: 'attended', label: 'Past attended' },
              ].map(({ key, label }) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.scopeChip, eventScope === key && styles.scopeChipActive]}
                  onPress={() => {
                    setEventScope(key);
                    if (key === 'attended' && viewMode === 'map') setViewMode('list');
                  }}
                >
                  <Text style={[styles.scopeChipText, eventScope === key && styles.scopeChipTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.sortControl}>
              <Text style={styles.sortLabel}>Sort by date:</Text>
              <TouchableOpacity
                style={[styles.scopeChip, dateSortOrder === 'asc' && styles.scopeChipActive]}
                onPress={() => setDateSortOrder('asc')}
              >
                <Text style={[styles.scopeChipText, dateSortOrder === 'asc' && styles.scopeChipTextActive]}>Oldest → Newest</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.scopeChip, dateSortOrder === 'desc' && styles.scopeChipActive]}
                onPress={() => setDateSortOrder('desc')}
              >
                <Text style={[styles.scopeChipText, dateSortOrder === 'desc' && styles.scopeChipTextActive]}>Newest → Oldest</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Event detail modal — opened from map callout */}
      <Modal
        visible={selectedEvent !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedEvent(null)}
      >
        {selectedEvent && (
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <ScrollView>
                <Text style={styles.modalTitle}>{selectedEvent.title}</Text>
                <Text style={styles.modalDate}>
                  {new Date(selectedEvent.start_time || selectedEvent.date).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                  {' · '}
                  {new Date(selectedEvent.start_time || selectedEvent.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={styles.modalLocation}>📍 {selectedEvent.location}</Text>
                <Text style={styles.modalAttendeeCount}>
                  👥 {(selectedEvent.attendee_count || 0)} / {(selectedEvent.capacity || 0)} attending
                </Text>
                {selectedEvent.organizer && (
                  <Text style={styles.modalOrganizer}>Hosted by {selectedEvent.organizer}</Text>
                )}
                {selectedEvent.description && (
                  <Text style={styles.modalDescription}>{selectedEvent.description}</Text>
                )}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[
                      styles.closeButton,
                      rsvpEventIds.has(selectedEvent.id) && styles.modalSecondaryButton,
                    ]}
                    onPress={() => { handleRSVP(selectedEvent); setSelectedEvent(null); }}
                  >
                    <Text
                      style={[
                        styles.closeButtonText,
                        rsvpEventIds.has(selectedEvent.id) && styles.modalSecondaryButtonText,
                      ]}
                    >
                      {rsvpEventIds.has(selectedEvent.id) ? 'Cancel RSVP' : 'RSVP'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalSecondaryButton}
                    onPress={() => { addToCalendar(selectedEvent); setSelectedEvent(null); }}
                  >
                    <Text style={styles.modalSecondaryButtonText}>Add to Calendar</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
              <TouchableOpacity
                style={styles.modalCloseX}
                onPress={() => setSelectedEvent(null)}
              >
                <Text style={styles.modalCloseXText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Filter Events</Text>
              
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Distance</Text>
                <View style={styles.filterOptions}>
                  {[100, 500, 1000].map(d => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.optionButton, radius === d && styles.optionButtonActive]}
                      onPress={() => setRadius(radius === d ? null : d)}
                    >
                      <Text style={[styles.optionText, radius === d && styles.optionTextActive]}>{d}m</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Time</Text>
                <View style={styles.filterOptions}>
                  {['now', '1hr', '2hr', 'today', 'week'].map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.optionButton, timeRange === t && styles.optionButtonActive]}
                      onPress={() => setTimeRange(timeRange === t ? null : t)}
                    >
                      <Text style={[styles.optionText, timeRange === t && styles.optionTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Mood</Text>
                <View style={styles.filterOptions}>
                  {['energetic', 'relaxed', 'social', 'focused'].map(m => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.optionButton, selectedMoods.includes(m) && styles.optionButtonActive]}
                      onPress={() => toggleMood(m)}
                    >
                      <Text style={[styles.optionText, selectedMoods.includes(m) && styles.optionTextActive]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Energy Level</Text>
                <View style={styles.filterOptions}>
                  {['high', 'medium', 'low'].map(e => (
                    <TouchableOpacity
                      key={e}
                      style={[styles.optionButton, selectedEnergy === e && styles.optionButtonActive]}
                      onPress={() => setSelectedEnergy(selectedEnergy === e ? null : e)}
                    >
                      <Text style={[styles.optionText, selectedEnergy === e && styles.optionTextActive]}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Min Rating</Text>
                <View style={styles.filterOptions}>
                  {[4.0, 4.5].map(r => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.optionButton, minRating === r && styles.optionButtonActive]}
                      onPress={() => setMinRating(minRating === r ? null : r)}
                    >
                      <Text style={[styles.optionText, minRating === r && styles.optionTextActive]}>{r}+</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.closeButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={attendeesModalEvent !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAttendeesModalEvent(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {attendeesModalEvent ? `${attendeesModalEvent.title} Attendees` : 'Attendees'}
            </Text>
            {attendeesLoading ? (
              <View style={styles.center}>
                <ActivityIndicator size="small" color="#ea580c" />
              </View>
            ) : attendeesError ? (
              <Text style={styles.error}>{attendeesError}</Text>
            ) : attendees.length === 0 ? (
              <Text style={styles.emptyStateText}>No attendees yet.</Text>
            ) : (
              <ScrollView style={styles.attendeesList}>
                {attendees.map((person, index) => (
                  <View key={`${person.user_id || 'user'}-${index}`} style={styles.attendeeRow}>
                    <Text style={styles.attendeeName}>{person.name || 'Member'}</Text>
                    <Text style={styles.attendeeMeta}>{person.email || person.user_id}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setAttendeesModalEvent(null)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {currentTab === 'events' ? (
        viewMode === 'list' ? (
          sortedScopedEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🔍</Text>
              <Text style={styles.emptyStateText}>
                {eventScope === 'attended'
                  ? 'No past attended events found.'
                  : eventScope === 'rsvped'
                    ? 'No RSVP events found.'
                    : `No events match your search${activeFilterCount > 0 ? ' or filters' : ''}.`}
              </Text>
              {activeFilterCount > 0 && (
                <TouchableOpacity onPress={resetFilters}>
                  <Text style={styles.clearFiltersText}>Clear filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={sortedScopedEvents}
              renderItem={renderEventItem}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.list}
              refreshing={loading}
              onRefresh={fetchEvents}
            />
          )
        ) : viewMode === 'map' ? (
          <View style={styles.mapContainer}>
            {MapView && Marker && Callout ? (
              <>
                <MapView
                  provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                  style={styles.map}
                  initialRegion={{
                    latitude: 51.3782,
                    longitude: -2.3264,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  }}
                >
                  {/* User location marker */}
                  <Marker
                    coordinate={USER_LOCATION}
                    title="You are here"
                    pinColor="#3b82f6"
                  />
                  {sortedScopedEvents.map(event =>
                    event.latitude && event.longitude ? (
                      <Marker
                        key={event.id}
                        coordinate={{ latitude: event.latitude, longitude: event.longitude }}
                        pinColor="#ea580c"
                      >
                        <Callout tooltip onPress={() => setSelectedEvent(event)}>
                          <View style={styles.callout}>
                            <Text style={styles.calloutTitle} numberOfLines={2}>{event.title}</Text>
                            <Text style={styles.calloutDate}>
                              {new Date(event.start_time || event.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              {' · '}
                              {new Date(event.start_time || event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                            <Text style={styles.calloutLocation} numberOfLines={1}>📍 {event.location}</Text>
                            <Text style={styles.calloutTap}>Tap for details →</Text>
                          </View>
                        </Callout>
                      </Marker>
                    ) : null
                  )}
                </MapView>
                {/* Events without coords — shown as a bottom sheet count */}
                {sortedScopedEvents.filter(e => !e.latitude || !e.longitude).length > 0 && (
                  <View style={styles.mapFootnote}>
                    <Text style={styles.mapFootnoteText}>
                      {sortedScopedEvents.filter(e => !e.latitude || !e.longitude).length} event(s) have no map location — switch to List view to see them all.
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.mapUnavailable}>
                <Text style={styles.emptyStateIcon}>🗺️</Text>
                <Text style={styles.emptyStateText}>Map module not found in this iOS build.</Text>
                <Text style={styles.emptyStateSubText}>Rebuild the app binary after installing dependencies.</Text>
              </View>
            )}
          </View>
        ) : (
          /* Filter panel — inline, no modal */
          <ScrollView contentContainerStyle={styles.filterPanel}>
            <View style={styles.filterPanelHeader}>
              <Text style={styles.modalTitle}>Filter Events</Text>
              {activeFilterCount > 0 && (
                <TouchableOpacity onPress={resetFilters}>
                  <Text style={styles.clearFiltersText}>Reset all</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Distance from you</Text>
              <View style={styles.filterOptions}>
                {[{ label: '100 m', val: 100 }, { label: '500 m', val: 500 }, { label: '1 km', val: 1000 }].map(({ label, val }) => (
                  <TouchableOpacity
                    key={val}
                    style={[styles.optionButton, radius === val && styles.optionButtonActive]}
                    onPress={() => setRadius(radius === val ? null : val)}
                  >
                    <Text style={[styles.optionText, radius === val && styles.optionTextActive]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>When</Text>
              <View style={styles.filterOptions}>
                {[{ label: 'Happening now', val: 'now' }, { label: 'Next 1 hr', val: '1hr' }, { label: 'Next 2 hrs', val: '2hr' }, { label: 'Today', val: 'today' }, { label: 'This week', val: 'week' }].map(({ label, val }) => (
                  <TouchableOpacity
                    key={val}
                    style={[styles.optionButton, timeRange === val && styles.optionButtonActive]}
                    onPress={() => setTimeRange(timeRange === val ? null : val)}
                  >
                    <Text style={[styles.optionText, timeRange === val && styles.optionTextActive]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Mood</Text>
              <View style={styles.filterOptions}>
                {['Energetic', 'Relaxed', 'Social', 'Focused'].map(m => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.optionButton, selectedMoods.includes(m.toLowerCase()) && styles.optionButtonActive]}
                    onPress={() => toggleMood(m.toLowerCase())}
                  >
                    <Text style={[styles.optionText, selectedMoods.includes(m.toLowerCase()) && styles.optionTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Energy level</Text>
              <View style={styles.filterOptions}>
                {['High', 'Medium', 'Low'].map(e => (
                  <TouchableOpacity
                    key={e}
                    style={[styles.optionButton, selectedEnergy === e.toLowerCase() && styles.optionButtonActive]}
                    onPress={() => setSelectedEnergy(selectedEnergy === e.toLowerCase() ? null : e.toLowerCase())}
                  >
                    <Text style={[styles.optionText, selectedEnergy === e.toLowerCase() && styles.optionTextActive]}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Min rating</Text>
              <View style={styles.filterOptions}>
                {[{ label: '4.0+', val: 4.0 }, { label: '4.5+', val: 4.5 }].map(({ label, val }) => (
                  <TouchableOpacity
                    key={val}
                    style={[styles.optionButton, minRating === val && styles.optionButtonActive]}
                    onPress={() => setMinRating(minRating === val ? null : val)}
                  >
                    <Text style={[styles.optionText, minRating === val && styles.optionTextActive]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setViewMode('list')}
            >
              <Text style={styles.closeButtonText}>
                Show {sortedScopedEvents.length} event{sortedScopedEvents.length !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )
      ) : currentTab === 'friends' ? (
        <FlatList
          data={friends}
          renderItem={renderFriendItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      ) : (
        renderProfile()
      )}

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabItem, currentTab === 'events' && styles.tabItemActive]}
          onPress={() => setCurrentTab('events')}
        >
          <Text style={[styles.tabText, currentTab === 'events' && styles.tabTextActive]}>Events</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabItem, currentTab === 'friends' && styles.tabItemActive]}
          onPress={() => setCurrentTab('friends')}
        >
          <Text style={[styles.tabText, currentTab === 'friends' && styles.tabTextActive]}>Friends</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabItem, currentTab === 'profile' && styles.tabItemActive]}
          onPress={() => setCurrentTab('profile')}
        >
          <Text style={[styles.tabText, currentTab === 'profile' && styles.tabTextActive]}>Profile</Text>
        </TouchableOpacity>
      </View>

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 24 : 0,
    backgroundColor: '#fff',
  },
  authTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ea580c',
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 20,
  },
  authToggleText: {
    textAlign: 'center',
    marginTop: 14,
    color: '#ea580c',
    fontWeight: '600',
  },
  forgotPasswordText: {
    marginTop: 10,
    color: '#ea580c',
    fontWeight: '600',
    textAlign: 'right',
  },
  authButton: {
    backgroundColor: '#ea580c',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  authButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  authButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#666',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#ea580c',
  },
  headerActions: {
    alignItems: 'center',
    gap: 8,
  },
  logoutButton: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  logoutButtonText: {
    color: '#c2410c',
    fontSize: 12,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  controls: {
    flexDirection: 'column',
    gap: 6,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    paddingHorizontal: 10,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
    color: '#999',
  },
  searchBar: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1a1a1a',
  },
  searchClearButton: {
    padding: 4,
  },
  searchClearText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  searchResultCount: {
    fontSize: 12,
    color: '#ea580c',
    fontWeight: '600',
    paddingHorizontal: 2,
  },
  viewToggle: {
    backgroundColor: '#ea580c',
    padding: 10,
    borderRadius: 8,
  },
  viewToggleText: {
    color: '#fff',
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapUnavailable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1a1a1a',
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  organizer: {
    fontSize: 14,
    color: '#ea580c',
    fontWeight: '600',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  attendanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  attendanceText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  inviteChip: {
    borderWidth: 1,
    borderColor: '#ea580c',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  inviteChipText: {
    color: '#ea580c',
    fontSize: 12,
    fontWeight: '700',
  },
  calendarButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ea580c',
  },
  calendarButtonText: {
    color: '#ea580c',
    fontWeight: '600',
    fontSize: 12,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ea580c',
  },
  rsvpButton: {
    backgroundColor: '#ea580c',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rsvpButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ea580c',
  },
  rsvpButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  rsvpButtonSecondaryText: {
    color: '#ea580c',
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
  retry: {
    color: '#ea580c',
    textDecorationLine: 'underline',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalAttendeeCount: {
    color: '#475569',
    fontSize: 14,
    marginBottom: 8,
  },
  attendeesList: {
    maxHeight: 280,
    marginBottom: 12,
  },
  attendeeRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  attendeeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
  },
  attendeeMeta: {
    marginTop: 2,
    fontSize: 13,
    color: '#64748b',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#eee',
  },
  optionButtonActive: {
    backgroundColor: '#ea580c',
    borderColor: '#ea580c',
  },
  optionText: {
    color: '#666',
  },
  optionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#ea580c',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  ratingContainer: {
    backgroundColor: '#fff9c4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    color: '#fbc02d',
    fontWeight: 'bold',
    fontSize: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  energyTag: {
    backgroundColor: '#e0f2f1',
  },
  tagText: {
    fontSize: 12,
    color: '#6b21a8',
  },
  friendsText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  tabItem: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  tabItemActive: {
    borderTopWidth: 2,
    borderTopColor: '#ea580c',
  },
  tabText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#ea580c',
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  friendStatus: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  messageButton: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  messageButtonText: {
    color: '#ea580c',
    fontWeight: '600',
    fontSize: 12,
  },
  profileContainer: {
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: '#ea580c',
  },
  editAvatarButton: {
    padding: 8,
  },
  editAvatarText: {
    color: '#ea580c',
    fontWeight: '600',
  },
  profileInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoSection: {
    marginBottom: 20,
  },
  settingsSection: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  interestText: {
    color: '#6b21a8',
    fontSize: 12,
    fontWeight: '600',
  },
  editProfileButton: {
    backgroundColor: '#ea580c',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  editProfileButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteAccountButton: {
    marginTop: 8,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteAccountButtonDisabled: {
    opacity: 0.6,
  },
  deleteAccountButtonText: {
    color: '#be123c',
    fontWeight: '700',
    fontSize: 15,
  },
  editForm: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  passwordInputContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 64,
  },
  passwordToggleButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  passwordToggleText: {
    color: '#ea580c',
    fontWeight: '700',
    fontSize: 13,
  },
  inputReadOnly: {
    backgroundColor: '#eef2f7',
    color: '#64748b',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  helperText: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  saveButton: {
    backgroundColor: '#ea580c',
  },
  saveButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#666',
  },
  saveButtonText: {
    color: '#fff',
  },
  // ── Segmented control ──────────────────────────────────────────────────────
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginTop: 12,
    padding: 3,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  segmentTextActive: {
    color: '#ea580c',
  },
  scopeControl: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  sortControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
    flexWrap: 'wrap',
  },
  sortLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  scopeChip: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  scopeChipActive: {
    backgroundColor: '#fff7ed',
    borderColor: '#fdba74',
  },
  scopeChipText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 12,
  },
  scopeChipTextActive: {
    color: '#c2410c',
  },
  // ── Map callout ────────────────────────────────────────────────────────────
  callout: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  calloutDate: {
    fontSize: 12,
    color: '#ea580c',
    marginBottom: 2,
  },
  calloutLocation: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  calloutTap: {
    fontSize: 11,
    color: '#ea580c',
    fontWeight: '600',
    textAlign: 'right',
  },
  // ── Map footnote ───────────────────────────────────────────────────────────
  mapFootnote: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.92)',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  mapFootnoteText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  // ── Empty state ────────────────────────────────────────────────────────────
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  clearFiltersText: {
    color: '#ea580c',
    fontWeight: '600',
    fontSize: 14,
  },
  // ── Inline filter panel ────────────────────────────────────────────────────
  filterPanel: {
    padding: 20,
    paddingBottom: 40,
  },
  filterPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  // ── Event detail modal ─────────────────────────────────────────────────────
  modalDate: {
    fontSize: 14,
    color: '#ea580c',
    fontWeight: '600',
    marginBottom: 6,
  },
  modalLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  modalOrganizer: {
    fontSize: 14,
    color: '#ea580c',
    fontWeight: '600',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalActions: {
    gap: 10,
    marginTop: 8,
  },
  modalSecondaryButton: {
    borderWidth: 1.5,
    borderColor: '#ea580c',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSecondaryButtonText: {
    color: '#ea580c',
    fontWeight: '600',
    fontSize: 15,
  },
  modalCloseX: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseXText: {
    fontSize: 18,
    color: '#666',
  },
  // ── Follow chip on event card ──────────────────────────────────────────────
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  followChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#ea580c',
  },
  followChipActive: {
    backgroundColor: '#ea580c',
  },
  followChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ea580c',
  },
  followChipTextActive: {
    color: '#fff',
  },
  // ── Profile stats row ──────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#eee',
  },
  // ── Profile sub-tabs ───────────────────────────────────────────────────────
  profileTabs: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  profileTabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  profileTabBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  profileTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  profileTabTextActive: {
    color: '#ea580c',
  },
  // ── Society card (following list) ─────────────────────────────────────────
  societyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  societyAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
  },
  societyInfo: {
    flex: 1,
  },
  societyName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  societyDesc: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  societyEvents: {
    fontSize: 12,
    color: '#ea580c',
    fontWeight: '600',
    marginTop: 3,
  },
  unfollowButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#ccc',
  },
  unfollowButtonText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  emptyStateSubText: {
    fontSize: 13,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
});
