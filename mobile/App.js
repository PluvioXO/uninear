import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, SafeAreaView, Platform, Image, TouchableOpacity, Alert, TextInput, Dimensions, Modal, ScrollView } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Calendar from 'expo-calendar';

// API URL - Use 10.0.2.2 for Android Emulator, localhost for iOS Simulator
// For physical devices, you must use your computer's LAN IP address (e.g., http://192.168.1.x:8000/events)
const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000/events' : 'http://127.0.0.1:8000/events';

const MOCK_USER = {
  name: 'Maximilian Nicholson',
  role: 'Student Member',
  avatar: 'https://ui-avatars.com/api/?name=Maximilian+Nicholson&background=a855f7&color=fff&size=128',
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
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [currentTab, setCurrentTab] = useState('events'); // 'events', 'friends', 'profile'
  
  // Profile State
  const [userProfile, setUserProfile] = useState(MOCK_USER);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState(MOCK_USER);

  // Filter State
  const [showFilters, setShowFilters] = useState(false);
  const [radius, setRadius] = useState(null); // 100, 500, 1000 (meters)
  const [timeRange, setTimeRange] = useState(null); // 'now', '1hr', '2hr', 'today', 'week'
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [selectedEnergy, setSelectedEnergy] = useState(null); // 'high', 'medium', 'low'
  const [minRating, setMinRating] = useState(null); // 4.0, 4.5

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
    // Search Filter
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

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

  const saveProfile = () => {
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
              style={[styles.button, styles.saveButton]}
              onPress={saveProfile}
            >
              <Text style={[styles.buttonText, styles.saveButtonText]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{userProfile.name}</Text>
          <Text style={styles.profileRole}>{userProfile.role}</Text>
          
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
        <ActivityIndicator size="large" color="#a855f7" />
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
          <TextInput
            style={styles.searchBar}
            placeholder="Search events..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.viewToggle}
            onPress={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
          >
            <Text style={styles.viewToggleText}>
              {viewMode === 'list' ? 'Map' : 'List'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

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
          <FlatList
            data={filteredEvents}
            renderItem={renderEventItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.list}
            refreshing={loading}
            onRefresh={fetchEvents}
          />
        ) : (
          <View style={styles.mapContainer}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={{
                latitude: 51.3758,
                longitude: -2.3599,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
            >
              {filteredEvents.map(event => (
                event.latitude && event.longitude ? (
                  <Marker
                    key={event.id}
                    coordinate={{
                      latitude: event.latitude,
                      longitude: event.longitude,
                    }}
                    title={event.title}
                    description={event.location}
                  />
                ) : null
              ))}
            </MapView>
          </View>
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
    color: '#a855f7',
    fontWeight: '600',
    marginTop: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#a855f7',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBar: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  viewToggle: {
    backgroundColor: '#a855f7',
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
    color: '#a855f7',
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
    borderColor: '#a855f7',
  },
  calendarButtonText: {
    color: '#a855f7',
    fontWeight: '600',
    fontSize: 12,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a855f7',
  },
  rsvpButton: {
    backgroundColor: '#a855f7',
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
    color: '#a855f7',
    textDecorationLine: 'underline',
  },
  filterButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
  },
  filterButtonText: {
    color: '#333',
    fontWeight: '600',
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
    backgroundColor: '#a855f7',
    borderColor: '#a855f7',
  },
  optionText: {
    color: '#666',
  },
  optionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#a855f7',
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
    borderTopColor: '#a855f7',
  },
  tabText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#a855f7',
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
    color: '#a855f7',
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
    borderColor: '#a855f7',
  },
  editAvatarButton: {
    padding: 8,
  },
  editAvatarText: {
    color: '#a855f7',
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
    color: '#a855f7',
    fontWeight: '600',
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
    backgroundColor: '#a855f7',
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
    backgroundColor: '#a855f7',
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#666',
  },
  saveButtonText: {
    color: '#fff',
  },
});
