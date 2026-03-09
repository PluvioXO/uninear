import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react'
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
  formatEventFetchErrorMessage: (error: { message?: string }) =>
    error.message?.startsWith('Failed to fetch events')
      ? error.message
      : `Failed to fetch events: ${error.message ?? 'Unknown error'}`,
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
      expect(screen.getByText('Failed to fetch events: Network error')).toBeInTheDocument()
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
      expect(screen.getByText('Failed to fetch events: Server error')).toBeInTheDocument()
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

// --- FR-03: Time Filter Tests ---

describe('FR-03: Time Filter', () => {
  it('test_FR03_time_filter: renders time filter chips with default "All" selected', async () => {
    render(<DashboardPage />)
    await waitFor(() => expect(mockFetchEvents).toHaveBeenCalled())

    const timeFilter = screen.getByTestId('time-filter')
    expect(timeFilter).toBeInTheDocument()

    // "All" button should have active styling (bg-white)
    const allBtn = screen.getByTestId('time-filter-all')
    expect(allBtn).toHaveClass('bg-white')

    // Other buttons should not have active styling
    const twoHrBtn = screen.getByTestId('time-filter-2hr')
    expect(twoHrBtn).not.toHaveClass('bg-white')
  })

  it('test_FR03_time_filter: selecting "Next 2 hours" calls fetchEvents with time_filter=2hr', async () => {
    render(<DashboardPage />)
    await waitFor(() => expect(mockFetchEvents).toHaveBeenCalledTimes(1))

    const twoHrBtn = screen.getByTestId('time-filter-2hr')
    fireEvent.click(twoHrBtn)

    await waitFor(() => {
      expect(mockFetchEvents).toHaveBeenCalledWith({ time_filter: '2hr' })
    })
  })

  it('test_FR03_time_filter: selecting "Today" calls fetchEvents with time_filter=today', async () => {
    render(<DashboardPage />)
    await waitFor(() => expect(mockFetchEvents).toHaveBeenCalledTimes(1))

    const todayBtn = screen.getByTestId('time-filter-today')
    fireEvent.click(todayBtn)

    await waitFor(() => {
      expect(mockFetchEvents).toHaveBeenCalledWith({ time_filter: 'today' })
    })
  })

  it('test_FR03_time_filter: selecting "This week" calls fetchEvents with time_filter=week', async () => {
    render(<DashboardPage />)
    await waitFor(() => expect(mockFetchEvents).toHaveBeenCalledTimes(1))

    const weekBtn = screen.getByTestId('time-filter-week')
    fireEvent.click(weekBtn)

    await waitFor(() => {
      expect(mockFetchEvents).toHaveBeenCalledWith({ time_filter: 'week' })
    })
  })

  it('test_FR03_time_filter: selecting "All" clears time filter', async () => {
    render(<DashboardPage />)
    await waitFor(() => expect(mockFetchEvents).toHaveBeenCalledTimes(1))

    // Select a filter first
    fireEvent.click(screen.getByTestId('time-filter-2hr'))
    await waitFor(() => expect(mockFetchEvents).toHaveBeenCalledTimes(2))

    // Then clear it
    fireEvent.click(screen.getByTestId('time-filter-all'))
    await waitFor(() => {
      expect(mockFetchEvents).toHaveBeenCalledTimes(3)
      expect(mockFetchEvents).toHaveBeenLastCalledWith(undefined)
    })
  })

  it('test_FR03_time_filter: time filter updates event list', async () => {
    mockFetchEvents.mockResolvedValueOnce(MOCK_EVENTS)
    mockFetchEvents.mockResolvedValueOnce([MOCK_EVENTS[0]])

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Annual Tech Hackathon')).toBeInTheDocument()
      expect(screen.getByText('Industry Panel Night')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('time-filter-2hr'))

    await waitFor(() => {
      expect(screen.getByText('Annual Tech Hackathon')).toBeInTheDocument()
      expect(screen.queryByText('Industry Panel Night')).not.toBeInTheDocument()
    })
  })

  it('test_FR03_time_filter: time filter combines with radius filter', async () => {
    render(<DashboardPage />)
    await waitFor(() => expect(mockFetchEvents).toHaveBeenCalledTimes(1))

    // Set time filter
    fireEvent.click(screen.getByTestId('time-filter-2hr'))
    await waitFor(() => expect(mockFetchEvents).toHaveBeenCalledTimes(2))

    // Set radius filter
    const radiusSelect = screen.getByTestId('radius-filter')
    fireEvent.change(radiusSelect, { target: { value: '500' } })

    await waitFor(() => {
      expect(mockFetchEvents).toHaveBeenCalledWith({
        lat: 51.3758,
        lng: -2.3599,
        radius_m: 500,
        time_filter: '2hr',
      })
    })
  })

  it('test_FR03_time_filter: active filter chip is visually highlighted', async () => {
    render(<DashboardPage />)
    await waitFor(() => expect(mockFetchEvents).toHaveBeenCalled())

    // Click "Today"
    const todayBtn = screen.getByTestId('time-filter-today')
    fireEvent.click(todayBtn)

    await waitFor(() => {
      expect(todayBtn).toHaveClass('bg-white')
      expect(todayBtn).toHaveClass('shadow-sm')
    })

    // "All" should no longer be highlighted
    const allBtn = screen.getByTestId('time-filter-all')
    expect(allBtn).not.toHaveClass('bg-white')
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

// --- FR-07: Keyword Search Tests ---

describe('FR-07: Keyword Search', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('test_FR07_keyword_search: renders search input', async () => {
    jest.useRealTimers()
    render(<DashboardPage />)
    await waitFor(() => expect(mockFetchEvents).toHaveBeenCalled())

    const searchInput = screen.getByTestId('search-input')
    expect(searchInput).toBeInTheDocument()
    expect(searchInput).toHaveAttribute('placeholder', 'Search events...')
  })

  it('test_FR07_keyword_search: search filters results via API', async () => {
    mockFetchEvents.mockResolvedValueOnce(MOCK_EVENTS)
    mockFetchEvents.mockResolvedValueOnce([MOCK_EVENTS[0]])

    render(<DashboardPage />)
    await waitFor(() => expect(mockFetchEvents).toHaveBeenCalledTimes(1))

    const searchInput = screen.getByTestId('search-input')
    fireEvent.change(searchInput, { target: { value: 'hackathon' } })

    // Advance past 300ms debounce
    act(() => { jest.advanceTimersByTime(300) })

    await waitFor(() => {
      expect(mockFetchEvents).toHaveBeenCalledWith({ search: 'hackathon' })
    })
  })

  it('test_FR07_keyword_search: shows "No events match your search" when empty results', async () => {
    mockFetchEvents.mockResolvedValueOnce(MOCK_EVENTS)
    mockFetchEvents.mockResolvedValueOnce([])

    render(<DashboardPage />)
    await waitFor(() => expect(mockFetchEvents).toHaveBeenCalledTimes(1))

    const searchInput = screen.getByTestId('search-input')
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

    act(() => { jest.advanceTimersByTime(300) })

    await waitFor(() => {
      expect(screen.getByText('No events match your search')).toBeInTheDocument()
    })
  })

  it('test_FR07_keyword_search: clearing search restores full event list', async () => {
    mockFetchEvents.mockResolvedValueOnce(MOCK_EVENTS)
    mockFetchEvents.mockResolvedValueOnce([MOCK_EVENTS[0]])
    mockFetchEvents.mockResolvedValueOnce(MOCK_EVENTS)

    render(<DashboardPage />)
    await waitFor(() => expect(mockFetchEvents).toHaveBeenCalledTimes(1))

    const searchInput = screen.getByTestId('search-input')

    // Type a search term
    fireEvent.change(searchInput, { target: { value: 'hackathon' } })
    act(() => { jest.advanceTimersByTime(300) })
    await waitFor(() => expect(mockFetchEvents).toHaveBeenCalledTimes(2))

    // Click clear button
    const clearBtn = screen.getByTestId('search-clear')
    fireEvent.click(clearBtn)

    await waitFor(() => {
      expect(mockFetchEvents).toHaveBeenCalledTimes(3)
      expect(mockFetchEvents).toHaveBeenLastCalledWith(undefined)
    })
  })

  it('test_FR07_keyword_search: Enter key triggers search immediately', async () => {
    mockFetchEvents.mockResolvedValueOnce(MOCK_EVENTS)
    mockFetchEvents.mockResolvedValueOnce([MOCK_EVENTS[0]])

    render(<DashboardPage />)
    await waitFor(() => expect(mockFetchEvents).toHaveBeenCalledTimes(1))

    const searchInput = screen.getByTestId('search-input')
    fireEvent.change(searchInput, { target: { value: 'hackathon' } })
    fireEvent.keyDown(searchInput, { key: 'Enter' })

    // Should trigger immediately without waiting for debounce
    await waitFor(() => {
      expect(mockFetchEvents).toHaveBeenCalledWith({ search: 'hackathon' })
    })
  })

  it('test_FR07_keyword_search: search combines with other filters', async () => {
    jest.useRealTimers()
    render(<DashboardPage />)
    await waitFor(() => expect(mockFetchEvents).toHaveBeenCalledTimes(1))

    // Set time filter
    fireEvent.click(screen.getByTestId('time-filter-2hr'))
    await waitFor(() => expect(mockFetchEvents).toHaveBeenCalledTimes(2))

    // Set radius filter
    const radiusSelect = screen.getByTestId('radius-filter')
    fireEvent.change(radiusSelect, { target: { value: '500' } })
    await waitFor(() => expect(mockFetchEvents).toHaveBeenCalledTimes(3))

    // Type search and press Enter
    const searchInput = screen.getByTestId('search-input')
    fireEvent.change(searchInput, { target: { value: 'coffee' } })
    fireEvent.keyDown(searchInput, { key: 'Enter' })

    await waitFor(() => {
      expect(mockFetchEvents).toHaveBeenCalledWith({
        lat: 51.3758,
        lng: -2.3599,
        radius_m: 500,
        time_filter: '2hr',
        search: 'coffee',
      })
    })
  })
})
