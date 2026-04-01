import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DiscoveryPage from '../../app/dashboard/discovery/page'

// Mock MagneticButton
jest.mock('../../components/MagneticButton', () => {
  return function MockMagneticButton({ label, onClick }: { label: string, onClick?: () => void }) {
    return <button onClick={onClick}>{label}</button>
  }
})

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }: { href: string, children: React.ReactNode }) {
    return <a href={href} {...props}>{children}</a>
  }
})

// Mock Supabase
jest.mock('../../lib/supabase', () => ({
  getSupabase: () => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
    },
  }),
}))

// Mock the API module
jest.mock('../../lib/api', () => ({
  fetchEvents: jest.fn(),
  fetchRecentActivity: jest.fn().mockResolvedValue([]),
  getUserRsvps: jest.fn(),
  formatEventFetchErrorMessage: (error: { message?: string }) =>
    error.message?.startsWith('Failed to fetch events')
      ? error.message
      : `Failed to fetch events: ${error.message ?? 'Unknown error'}`,
}))

// Mock the MapView component (Leaflet requires browser DOM APIs not available in jsdom)
jest.mock('../../components/MapView', () => {
  return function MockMapView({ events }: { events: Array<{ id: number; title: string; latitude?: number; longitude?: number }> }) {
    const eventsWithCoords = events.filter(e => e.latitude != null && e.longitude != null)
    return (
      <div data-testid="map-container">
        {eventsWithCoords.map(event => (
          <div key={event.id} data-testid={`map-marker-${event.id}`}>
            {event.title}
          </div>
        ))}
      </div>
    )
  }
})

import { fetchEvents } from '../../lib/api'
const mockFetchEvents = fetchEvents as jest.MockedFunction<typeof fetchEvents>

const MOCK_EVENTS_WITH_COORDS = [
  {
    id: 1,
    title: 'Campus Hackathon',
    description: 'Build something amazing',
    start_time: '2026-10-15T09:00:00',
    location: 'Engineering Hub',
    capacity: 200,
    attendee_count: 142,
    status: 'Published',
    latitude: 51.3791,
    longitude: -2.3271,
  },
  {
    id: 2,
    title: 'Panel Night',
    description: 'Industry talks',
    start_time: '2026-10-22T18:30:00',
    location: 'Main Auditorium',
    capacity: 150,
    attendee_count: 89,
    status: 'Published',
    latitude: 51.3758,
    longitude: -2.3599,
  },
  {
    id: 3,
    title: 'No-Location Event',
    description: 'Online event',
    start_time: '2026-10-25T10:00:00',
    location: 'Online',
    capacity: 500,
    attendee_count: 200,
    status: 'Published',
  },
]

beforeEach(() => {
  jest.clearAllMocks()
  mockFetchEvents.mockResolvedValue(MOCK_EVENTS_WITH_COORDS)
})

// --- FR-08: Map View Tests ---

describe('FR-08: Map View', () => {
  it('test_FR08_map_view: renders list/map toggle on dashboard', async () => {
    render(<DiscoveryPage />)
    await waitFor(() => expect(mockFetchEvents).toHaveBeenCalled())

    expect(screen.getByTestId('view-toggle')).toBeInTheDocument()
    expect(screen.getByTestId('view-toggle-list')).toBeInTheDocument()
    expect(screen.getByTestId('view-toggle-map')).toBeInTheDocument()
  })

  it('test_FR08_map_view: defaults to list view', async () => {
    render(<DiscoveryPage />)
    await waitFor(() => expect(mockFetchEvents).toHaveBeenCalled())

    // List view should show event titles directly
    expect(screen.getByText('Campus Hackathon')).toBeInTheDocument()
    // Map container should not be visible
    expect(screen.queryByTestId('map-container')).not.toBeInTheDocument()
  })

  it('test_FR08_map_view: switches to map view and displays markers', async () => {
    render(<DiscoveryPage />)
    await waitFor(() => expect(mockFetchEvents).toHaveBeenCalled())

    // Click map toggle
    fireEvent.click(screen.getByTestId('view-toggle-map'))

    // Map container should appear
    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument()
    })

    // Markers for events with coordinates should appear
    expect(screen.getByTestId('map-marker-1')).toBeInTheDocument()
    expect(screen.getByTestId('map-marker-2')).toBeInTheDocument()
    // Event without coordinates should NOT have a marker
    expect(screen.queryByTestId('map-marker-3')).not.toBeInTheDocument()
  })

  it('test_FR08_map_view: marker shows event title', async () => {
    render(<DiscoveryPage />)
    await waitFor(() => expect(mockFetchEvents).toHaveBeenCalled())

    fireEvent.click(screen.getByTestId('view-toggle-map'))

    await waitFor(() => {
      expect(screen.getByTestId('map-marker-1')).toHaveTextContent('Campus Hackathon')
      expect(screen.getByTestId('map-marker-2')).toHaveTextContent('Panel Night')
    })
  })

  it('test_FR08_map_view: can switch back to list view', async () => {
    render(<DiscoveryPage />)
    await waitFor(() => expect(mockFetchEvents).toHaveBeenCalled())

    // Switch to map
    fireEvent.click(screen.getByTestId('view-toggle-map'))
    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument()
    })

    // Switch back to list
    fireEvent.click(screen.getByTestId('view-toggle-list'))
    expect(screen.queryByTestId('map-container')).not.toBeInTheDocument()
    expect(screen.getByText('Campus Hackathon')).toBeInTheDocument()
  })
})

// --- NFR-13: Google Maps (Leaflet) Integration Tests ---

describe('NFR-13: Map Integration', () => {
  it('test_NFR13_google_maps_integration: map component loads when toggled', async () => {
    render(<DiscoveryPage />)
    await waitFor(() => expect(mockFetchEvents).toHaveBeenCalled())

    fireEvent.click(screen.getByTestId('view-toggle-map'))

    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument()
    })
  })

  it('test_NFR13_google_maps_integration: shows loading state in map mode', async () => {
    mockFetchEvents.mockReturnValue(new Promise(() => {}))

    render(<DiscoveryPage />)

    fireEvent.click(screen.getByTestId('view-toggle-map'))

    // Should show loading skeleton, not map
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
    expect(screen.queryByTestId('map-container')).not.toBeInTheDocument()
  })

  it('test_NFR13_google_maps_integration: shows error state with retry in map mode', async () => {
    mockFetchEvents.mockRejectedValue(new Error('Network error'))

    render(<DiscoveryPage />)

    await waitFor(() => {
      expect(screen.getByText('Unable to load events. Please try again.')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('view-toggle-map'))

    // Should show error with retry, not map
    expect(screen.getByText('Retry')).toBeInTheDocument()
    expect(screen.queryByTestId('map-container')).not.toBeInTheDocument()
  })
})
