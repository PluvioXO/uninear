import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import DashboardPage from '../../app/dashboard/page'

// Mock the components used in DashboardPage
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

// Mock the API module
jest.mock('../../lib/api', () => ({
  fetchEvents: jest.fn(),
}))

import { fetchEvents } from '../../lib/api'
const mockFetchEvents = fetchEvents as jest.MockedFunction<typeof fetchEvents>

const MOCK_EVENTS = [
  {
    id: 1,
    title: 'Annual Tech Hackathon',
    description: 'Build something amazing in 24 hours',
    start_time: '2026-10-15T09:00:00',
    location: 'Engineering Hub',
    capacity: 200,
    attendee_count: 142,
    status: 'Published',
  },
  {
    id: 2,
    title: 'Industry Panel Night',
    description: 'Hear from leading tech professionals',
    start_time: '2026-10-22T18:30:00',
    location: 'Main Auditorium',
    capacity: 150,
    attendee_count: 89,
    status: 'Published',
  },
]

beforeEach(() => {
  jest.clearAllMocks()
  mockFetchEvents.mockResolvedValue(MOCK_EVENTS)
})

describe('Dashboard Integration', () => {
  it('opens the create event modal when clicking the create button', async () => {
    render(<DashboardPage />)
    await waitFor(() => expect(mockFetchEvents).toHaveBeenCalled())

    const createTrigger = screen.getByTestId('create-event-trigger')
    fireEvent.click(createTrigger)

    expect(screen.getByText('Create New Event')).toBeInTheDocument()
  })

  it('renders navigation links', async () => {
    render(<DashboardPage />)
    await waitFor(() => expect(mockFetchEvents).toHaveBeenCalled())

    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Analytics' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument()
  })
})

// --- FR-01: Event List Display Tests ---

describe('FR-01: Event List Display', () => {
  it('renders events from the API sorted by date', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Annual Tech Hackathon')).toBeInTheDocument()
      expect(screen.getByText('Industry Panel Night')).toBeInTheDocument()
    })

    // Verify DOM order: earlier event appears first
    const hackathon = screen.getByText('Annual Tech Hackathon')
    const panel = screen.getByText('Industry Panel Night')
    expect(hackathon.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    expect(mockFetchEvents).toHaveBeenCalledTimes(1)
  })

  it('shows loading skeleton while fetching', () => {
    // Keep the promise pending
    mockFetchEvents.mockReturnValue(new Promise(() => {}))

    render(<DashboardPage />)

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
  })

  it('shows "No upcoming events" when API returns empty array', async () => {
    mockFetchEvents.mockResolvedValue([])

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('No upcoming events')).toBeInTheDocument()
    })
  })

  it('shows error state with retry button on API failure', async () => {
    mockFetchEvents.mockRejectedValue(new Error('Network error'))

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Unable to load events. Please try again.')).toBeInTheDocument()
    })
    expect(screen.getByText('Retry')).toBeInTheDocument()
  })

  it('retries fetching events when retry button is clicked', async () => {
    mockFetchEvents.mockRejectedValueOnce(new Error('Network error'))
    mockFetchEvents.mockResolvedValueOnce(MOCK_EVENTS)

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Retry'))

    await waitFor(() => {
      expect(screen.getByText('Annual Tech Hackathon')).toBeInTheDocument()
    })

    expect(mockFetchEvents).toHaveBeenCalledTimes(2)
  })

  it('displays event details: title, date, location, attendee count', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Annual Tech Hackathon')).toBeInTheDocument()
    })

    // Check attendee count is shown
    expect(screen.getByText(/142 \/ 200 registered/)).toBeInTheDocument()
    // Check location is shown (part of the date/time/location line)
    expect(screen.getByText(/Engineering Hub/)).toBeInTheDocument()
  })
})

// --- NFR-14: Event API Integration Tests ---

describe('NFR-14: Event API Integration', () => {
  it('test_NFR14_events_api_integration: renders all required API fields in event cards', async () => {
    const eventsWithAllFields = [
      {
        id: 10,
        title: 'Campus Meetup',
        description: 'A social gathering',
        start_time: '2026-06-01T14:00:00Z',
        location: 'Student Union',
        capacity: 100,
        attendee_count: 25,
        status: 'Published',
        organizer: 'CS Society',
      },
    ]
    mockFetchEvents.mockResolvedValue(eventsWithAllFields)

    render(<DashboardPage />)

    await waitFor(() => {
      // AC-1: title rendered
      expect(screen.getByText('Campus Meetup')).toBeInTheDocument()
    })

    // AC-1: location rendered (in date/time/location line)
    expect(screen.getByText(/Student Union/)).toBeInTheDocument()
    // AC-1: attendee count / capacity rendered
    expect(screen.getByText(/25 \/ 100 registered/)).toBeInTheDocument()
    // AC-1: status badge rendered
    expect(screen.getByText('Published')).toBeInTheDocument()
  })

  it('test_NFR14_events_api_integration: error state shows correct message and retry', async () => {
    mockFetchEvents.mockRejectedValue(new Error('Server error'))

    render(<DashboardPage />)

    await waitFor(() => {
      // AC-2: correct error message
      expect(screen.getByText('Unable to load events. Please try again.')).toBeInTheDocument()
    })

    // AC-2: retry button present
    const retryButton = screen.getByText('Retry')
    expect(retryButton).toBeInTheDocument()

    // AC-2: retry re-calls fetchEvents
    mockFetchEvents.mockResolvedValueOnce([
      {
        id: 1,
        title: 'Recovered Event',
        start_time: '2026-06-01T10:00:00Z',
        location: 'Hall',
        capacity: 50,
        attendee_count: 10,
        status: 'Published',
      },
    ])

    fireEvent.click(retryButton)

    await waitFor(() => {
      expect(screen.getByText('Recovered Event')).toBeInTheDocument()
    })
  })
})

// --- FR-02: Location/Radius Filter Tests ---

describe('FR-02: Location/Radius Filter', () => {
  it('test_FR02_location_filter: renders radius filter dropdown with options', async () => {
    render(<DashboardPage />)
    await waitFor(() => expect(mockFetchEvents).toHaveBeenCalled())

    const select = screen.getByTestId('radius-filter') as HTMLSelectElement
    expect(select).toBeInTheDocument()
    expect(select.value).toBe('') // Default: All distances

    // Verify options exist
    const options = select.querySelectorAll('option')
    const optionValues = Array.from(options).map(o => o.value)
    expect(optionValues).toContain('')      // All distances
    expect(optionValues).toContain('100')   // 100m
    expect(optionValues).toContain('500')   // 500m
    expect(optionValues).toContain('1000')  // 1km
  })

  it('test_FR02_location_filter: selecting radius calls fetchEvents with params', async () => {
    render(<DashboardPage />)
    await waitFor(() => expect(mockFetchEvents).toHaveBeenCalledTimes(1))

    const select = screen.getByTestId('radius-filter')
    fireEvent.change(select, { target: { value: '500' } })

    await waitFor(() => {
      expect(mockFetchEvents).toHaveBeenCalledWith({
        lat: 51.3758,
        lng: -2.3599,
        radius_m: 500,
      })
    })
  })

  it('test_FR02_location_filter: clearing filter calls fetchEvents without params', async () => {
    render(<DashboardPage />)
    await waitFor(() => expect(mockFetchEvents).toHaveBeenCalledTimes(1))

    // First select a radius
    const select = screen.getByTestId('radius-filter')
    fireEvent.change(select, { target: { value: '500' } })
    await waitFor(() => expect(mockFetchEvents).toHaveBeenCalledTimes(2))

    // Then clear the filter
    fireEvent.change(select, { target: { value: '' } })
    await waitFor(() => {
      expect(mockFetchEvents).toHaveBeenCalledTimes(3)
      expect(mockFetchEvents).toHaveBeenLastCalledWith(undefined)
    })
  })

  it('test_FR02_location_filter: event count updates when filter changes', async () => {
    // First call returns 2 events (no filter)
    mockFetchEvents.mockResolvedValueOnce(MOCK_EVENTS)
    // Second call returns 1 event (filtered)
    mockFetchEvents.mockResolvedValueOnce([MOCK_EVENTS[0]])

    render(<DashboardPage />)

    // Find the Active Events stat card by its label, then check the value within it
    await waitFor(() => {
      const activeEventsLabel = screen.getByText('Active Events')
      const card = activeEventsLabel.closest('div.border') as HTMLElement
      expect(within(card).getByText('2')).toBeInTheDocument()
    })

    const select = screen.getByTestId('radius-filter')
    fireEvent.change(select, { target: { value: '500' } })

    await waitFor(() => {
      const activeEventsLabel = screen.getByText('Active Events')
      const card = activeEventsLabel.closest('div.border') as HTMLElement
      expect(within(card).getByText('1')).toBeInTheDocument()
    })
  })
})
