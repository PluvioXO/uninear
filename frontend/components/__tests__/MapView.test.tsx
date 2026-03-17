/**
 * Unit tests for MapView component.
 * Leaflet is mocked since jsdom doesn't support full DOM APIs required by Leaflet.
 */

const mockSetView = jest.fn().mockReturnThis()
const mockAddTo = jest.fn().mockReturnThis()
const mockBindPopup = jest.fn().mockReturnThis()
const mockRemoveLayer = jest.fn()
const mockRemove = jest.fn()
const mockEachLayer = jest.fn()

const mockMarker = jest.fn(() => ({
  addTo: mockAddTo,
  bindPopup: mockBindPopup,
}))

const mockTileLayer = jest.fn(() => ({
  addTo: mockAddTo,
}))

const mockMapInstance = {
  setView: mockSetView,
  remove: mockRemove,
  eachLayer: mockEachLayer,
  removeLayer: mockRemoveLayer,
}

const mockMap = jest.fn(() => mockMapInstance)

jest.mock('leaflet', () => ({
  map: (...args: unknown[]) => mockMap(...args),
  tileLayer: (...args: unknown[]) => mockTileLayer(...args),
  marker: (...args: unknown[]) => mockMarker(...args),
  Marker: class Marker {},
  Icon: {
    Default: {
      prototype: {},
      mergeOptions: jest.fn(),
    },
  },
}))

jest.mock('leaflet/dist/leaflet.css', () => ({}))

import { render, screen } from '@testing-library/react'
import MapView from '../MapView'

beforeEach(() => {
  jest.clearAllMocks()
  mockEachLayer.mockImplementation(() => {})
})

describe('MapView Component', () => {
  it('renders map container element', () => {
    render(<MapView events={[]} />)
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
  })

  it('initializes Leaflet map centered on Bath campus', () => {
    render(<MapView events={[]} />)

    expect(mockMap).toHaveBeenCalledTimes(1)
    // setView is chained from L.map().setView()
    expect(mockMapInstance.setView).toHaveBeenCalledWith([51.3758, -2.3599], 14)
  })

  it('adds OpenStreetMap tile layer', () => {
    render(<MapView events={[]} />)

    expect(mockTileLayer).toHaveBeenCalledWith(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      expect.objectContaining({ attribution: expect.stringContaining('OpenStreetMap') })
    )
  })

  it('creates markers for events with coordinates', () => {
    const events = [
      { id: 1, title: 'Test Event', date: '2026-06-01T10:00:00', location: 'Bath', attendees: 50, latitude: 51.38, longitude: -2.36 },
      { id: 2, title: 'No Coords', date: '2026-06-02T10:00:00', location: 'Online', attendees: 100 },
    ]

    render(<MapView events={events} />)

    // Only one marker for event with coords
    expect(mockMarker).toHaveBeenCalledTimes(1)
    expect(mockMarker).toHaveBeenCalledWith([51.38, -2.36])
  })

  it('binds popup with escaped event title (XSS prevention)', () => {
    const events = [
      { id: 1, title: '<script>alert("xss")</script>', date: '2026-06-01T10:00:00', location: 'Bath', attendees: 10, latitude: 51.38, longitude: -2.36 },
    ]

    render(<MapView events={events} />)

    expect(mockBindPopup).toHaveBeenCalledTimes(1)
    const popupHtml = mockBindPopup.mock.calls[0][0] as string
    // Should NOT contain raw <script> tag
    expect(popupHtml).not.toContain('<script>')
    // Should contain escaped version
    expect(popupHtml).toContain('&lt;script&gt;')
  })

  it('popup contains View Details link with event id', () => {
    const events = [
      { id: 42, title: 'My Event', date: '2026-06-01T10:00:00', location: 'Bath', attendees: 5, latitude: 51.38, longitude: -2.36 },
    ]

    render(<MapView events={events} />)

    const popupHtml = mockBindPopup.mock.calls[0][0] as string
    expect(popupHtml).toContain('View Details')
    expect(popupHtml).toContain('/dashboard/discovery/42')
  })

  it('popup contains attendee count', () => {
    const events = [
      { id: 1, title: 'Event', date: '2026-06-01T10:00:00', location: 'Bath', attendees: 75, latitude: 51.38, longitude: -2.36 },
    ]

    render(<MapView events={events} />)

    const popupHtml = mockBindPopup.mock.calls[0][0] as string
    expect(popupHtml).toContain('75 attendees')
  })
})
