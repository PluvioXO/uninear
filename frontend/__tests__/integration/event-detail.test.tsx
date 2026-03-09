import { render, screen, waitFor } from '@testing-library/react'
import EventDetailPage from '../../app/events/[id]/page'

const mockPush = jest.fn()
let mockParams: { id: string } = { id: '1' }
const mockGetSession = jest.fn()

jest.mock('next/navigation', () => ({
  useParams: () => mockParams,
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }: { href: string, children: React.ReactNode }) {
    return <a href={href} {...props}>{children}</a>
  }
})

jest.mock('../../lib/supabase', () => ({
  getSupabase: () => ({
    auth: {
      getSession: mockGetSession,
    },
  }),
}))

jest.mock('../../lib/api', () => {
  const actual = jest.requireActual('../../lib/api')
  return {
    ...actual,
    fetchEvents: jest.fn(),
    rsvpToEvent: jest.fn(),
    cancelRsvp: jest.fn(),
    getUserRsvps: jest.fn(),
  }
})

import { fetchEvents } from '../../lib/api'
const mockFetchEvents = fetchEvents as jest.MockedFunction<typeof fetchEvents>

const MOCK_EVENT = {
  id: 1,
  title: 'Annual Tech Hackathon',
  description: 'Build something amazing in 24 hours',
  start_time: '2026-10-15T09:00:00',
  location: 'Engineering Hub',
  capacity: 200,
  attendee_count: 142,
  status: 'Published',
}

beforeEach(() => {
  jest.clearAllMocks()
  mockParams = { id: '1' }
  mockGetSession.mockResolvedValue({ data: { session: null } })
  mockFetchEvents.mockResolvedValue([MOCK_EVENT])
})

describe('Event detail page', () => {
  it('renders the requested event details when the event exists', async () => {
    render(<EventDetailPage />)

    await waitFor(() => {
      expect(screen.getByTestId('event-title')).toHaveTextContent('Annual Tech Hackathon')
    })

    expect(screen.getByTestId('event-location')).toHaveTextContent('Engineering Hub')
    expect(screen.getByTestId('event-attendees')).toHaveTextContent('142 / 200 attending')
    expect(screen.getByTestId('event-description')).toHaveTextContent('Build something amazing in 24 hours')
  })

  it('shows an invalid ID error without calling fetchEvents', async () => {
    mockParams = { id: 'abc' }

    render(<EventDetailPage />)

    expect(await screen.findByText('Invalid event ID')).toBeInTheDocument()
    expect(mockFetchEvents).not.toHaveBeenCalled()
  })

  it('shows event not found when the requested event is missing', async () => {
    mockParams = { id: '99' }
    mockFetchEvents.mockResolvedValue([MOCK_EVENT])

    render(<EventDetailPage />)

    expect(await screen.findByText('Event not found')).toBeInTheDocument()
  })

  it('shows the detailed fetch failure reason when loading the event fails', async () => {
    mockFetchEvents.mockRejectedValue(
      new Error('Failed to fetch events (503 Service Unavailable): Unable to load events'),
    )

    render(<EventDetailPage />)

    expect(
      await screen.findByText('Failed to fetch events (503 Service Unavailable): Unable to load events'),
    ).toBeInTheDocument()
  })
})
