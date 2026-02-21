import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, SafeAreaView, Platform, Image, TouchableOpacity, Alert, TextInput, Dimensions, Modal, ScrollView } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Calendar from 'expo-calendar';

// API URL — production backend
const API_URL = 'https://uninear-gvjz.vercel.app/events';

const MOCK_USER = {
  name: 'Maximilian Nicholson',
  email: 'maximilian.nicholson@bath.ac.uk',
  role: 'Student Member',
  avatar: 'https://ui-avatars.com/api/?name=Maximilian+Nicholson&background=ea580c&color=fff&size=128',
  bio: 'Computer Science student at University of Bath. Love hackathons and coffee.',
  location: 'Bath, UK',
  interests: ['Coding', 'Hackathons', 'Coffee', 'Music', 'Tech']
};

// Mock User Location (Bath, UK)
const USER_LOCATION = {
  latitude: 51.3758,
  longitude: -2.3599
};

const MOCK_FRIENDS = [
  { id: 1, name: 'Alice Johnson', status: 'Studying at Library', avatar: 'https://ui-avatars.com/api/?name=Alice+Johnson&background=ffadad&color=fff' },
  { id: 2, name: 'Bob Smith', status: 'At the Gym', avatar: 'https://ui-avatars.com/api/?name=Bob+Smith&background=ffd6a5&color=fff' },
  { id: 3, name: 'Charlie Brown', status: 'In Class', avatar: 'https://ui-avatars.com/api/?name=Charlie+Brown&background=fdffb6&color=fff' },
  { id: 4, name: 'David Wilson', status: 'Lunch Break', avatar: 'https://ui-avatars.com/api/?name=David+Wilson&background=caffbf&color=fff' },
  { id: 5, name: 'Eve Davis', status: 'Available', avatar: 'https://ui-avatars.com/api/?name=Eve+Davis&background=9bf6ff&color=fff' },
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list', 'map', 'filter'
  const [currentTab, setCurrentTab] = useState('events'); // 'events', 'friends', 'profile'
  const [selectedEvent, setSelectedEvent] = useState(null); // event detail modal
  
  // Profile State
  const [userProfile, setUserProfile] = useState(MOCK_USER);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState(MOCK_USER);

  // Filter State
  const [radius, setRadius] = useState(null);
  const [timeRange, setTimeRange] = useState(null);
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [selectedEnergy, setSelectedEnergy] = useState(null);
  const [minRating, setMinRating] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      console.log(`Fetching events from: ${API_URL}`);
      const response = await fetch(API_URL);
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = (eventTitle) => {
    Alert.alert('Success', `You have successfully RSVP'd to ${eventTitle}!`);
  };

  const toggleMood = (mood) => {
    if (selectedMoods.includes(mood)) {
      setSelectedMoods(selectedMoods.filter(m => m !== mood));
    } else {
      setSelectedMoods([...selectedMoods, mood]);
    }
  };

  const filteredEvents = events.filter(event => {
    // Search Filter — title, location, organizer, description
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        (event.title       || '').toLowerCase().includes(q) ||
        (event.location    || '').toLowerCase().includes(q) ||
        (event.organizer   || '').toLowerCase().includes(q) ||
        (event.description || '').toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }

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

  const isBathEmail = (email) => /^[^@\s]+@bath\.ac\.uk$/i.test(email);
  const showEmailError = editForm.email.length > 0 && !isBathEmail(editForm.email);
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

      {isEditingProfile ? (
        <View style={styles.editForm}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={editForm.name}
            onChangeText={(text) => setEditForm({...editForm, name: text})}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, showEmailError && styles.inputError]}
            value={editForm.email}
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={(text) => setEditForm({...editForm, email: text})}
          />
          {showEmailError && (
            <Text style={styles.errorText}>Only @bath.ac.uk emails are allowed</Text>
          )}

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
          <Text style={styles.profileRole}>{userProfile.role}</Text>
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
        </View>
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

  const renderEventItem = ({ item }) => (
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
      {item.organizer && <Text style={styles.organizer}>Hosted by {item.organizer}</Text>}
      
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

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.calendarButton}
          onPress={() => addToCalendar(item)}
        >
          <Text style={styles.calendarButtonText}>Add to Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.rsvpButton}
          onPress={() => handleRSVP(item.title)}
        >
          <Text style={styles.rsvpButtonText}>RSVP</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
        <Text style={styles.error}>Error: {error}</Text>
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
            <Text style={styles.userName}>{MOCK_USER.name}</Text>
            <Text style={styles.userRole}>{MOCK_USER.role}</Text>
          </View>
          <Image source={{ uri: MOCK_USER.avatar }} style={styles.avatar} />
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
              {filteredEvents.length} result{filteredEvents.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot;
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
                {selectedEvent.organizer && (
                  <Text style={styles.modalOrganizer}>Hosted by {selectedEvent.organizer}</Text>
                )}
                {selectedEvent.description && (
                  <Text style={styles.modalDescription}>{selectedEvent.description}</Text>
                )}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => { handleRSVP(selectedEvent.title); setSelectedEvent(null); }}
                  >
                    <Text style={styles.closeButtonText}>RSVP</Text>
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

      {currentTab === 'events' ? (
        viewMode === 'list' ? (
          filteredEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🔍</Text>
              <Text style={styles.emptyStateText}>No events match your search{activeFilterCount > 0 ? ' or filters' : ''}.</Text>
              {activeFilterCount > 0 && (
                <TouchableOpacity onPress={resetFilters}>
                  <Text style={styles.clearFiltersText}>Clear filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={filteredEvents}
              renderItem={renderEventItem}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.list}
              refreshing={loading}
              onRefresh={fetchEvents}
            />
          )
        ) : viewMode === 'map' ? (
          <View style={styles.mapContainer}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={{
                latitude: 51.3758,
                longitude: -2.3599,
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
              {filteredEvents.map(event =>
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
            {filteredEvents.filter(e => !e.latitude || !e.longitude).length > 0 && (
              <View style={styles.mapFootnote}>
                <Text style={styles.mapFootnoteText}>
                  {filteredEvents.filter(e => !e.latitude || !e.longitude).length} event(s) have no map location — switch to List view to see them all.
                </Text>
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
                Show {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )
      ) : currentTab === 'friends' ? (
        <FlatList
          data={MOCK_FRIENDS}
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
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
  userRole: {
    fontSize: 12,
    color: '#ea580c',
    fontWeight: '600',
    marginTop: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#ea580c',
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
  rsvpButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
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
  profileRole: {
    fontSize: 14,
    color: '#ea580c',
    fontWeight: '600',
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
  inputError: {
    borderColor: '#ef4444',
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
});
