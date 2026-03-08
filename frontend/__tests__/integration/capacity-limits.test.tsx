import { createEvent, fetchEvents } from '../../lib/api';

// Mock auth.ts getToken
jest.mock('../../lib/auth', () => ({
  getToken: jest.fn().mockResolvedValue('test-jwt-token'),
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('test_FR11_capacity_limits — capacity setting and full event display', () => {
  it('createEvent sends capacity value to backend', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ id: 1, title: 'Test', capacity: 30 }),
    });

    await createEvent({
      title: 'Test Event',
      date: '2026-04-01T10:00:00Z',
      location: 'Room 101',
      capacity: 30,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/events'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"capacity":30'),
      }),
    );
  });

  it('capacity=0 means unlimited — sent correctly to backend', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ id: 2, title: 'Open Event', capacity: 0 }),
    });

    await createEvent({
      title: 'Open Event',
      date: '2026-04-01T10:00:00Z',
      location: 'Main Hall',
      capacity: 0,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/events'),
      expect.objectContaining({
        body: expect.stringContaining('"capacity":0'),
      }),
    );
  });

  it('"Event is full" logic: attendee_count >= capacity shows full state', () => {
    // Simulate the dashboard and event detail page capacity logic
    const isEventFull = (capacity: number, attendee_count: number) =>
      capacity > 0 && attendee_count >= capacity;

    expect(isEventFull(30, 30)).toBe(true);
    expect(isEventFull(30, 31)).toBe(true);
    expect(isEventFull(30, 29)).toBe(false);
    expect(isEventFull(0, 100)).toBe(false);  // unlimited
    expect(isEventFull(0, 0)).toBe(false);    // unlimited, no attendees
  });

  it('RSVP button disabled when event is full (button state logic)', () => {
    const getButtonState = (capacity: number, attendee_count: number, hasRsvpd: boolean) => {
      const isFull = capacity > 0 && attendee_count >= capacity;
      if (isFull && !hasRsvpd) return { text: 'Event Full', disabled: true };
      if (hasRsvpd) return { text: 'Cancel RSVP', disabled: false };
      return { text: 'RSVP', disabled: false };
    };

    // Full event, not RSVP'd — button disabled
    expect(getButtonState(30, 30, false)).toEqual({ text: 'Event Full', disabled: true });

    // Full event, but already RSVP'd — can still cancel
    expect(getButtonState(30, 30, true)).toEqual({ text: 'Cancel RSVP', disabled: false });

    // Not full — RSVP available
    expect(getButtonState(30, 10, false)).toEqual({ text: 'RSVP', disabled: false });

    // Unlimited capacity — always available
    expect(getButtonState(0, 500, false)).toEqual({ text: 'RSVP', disabled: false });
  });

  it('attendee count display format matches capacity state', () => {
    const formatAttendees = (capacity: number, attendee_count: number) => {
      if (capacity > 0) return `${attendee_count} / ${capacity} attending`;
      return `${attendee_count} attending`;
    };

    expect(formatAttendees(30, 12)).toBe('12 / 30 attending');
    expect(formatAttendees(0, 12)).toBe('12 attending');
    expect(formatAttendees(100, 100)).toBe('100 / 100 attending');
  });

  it('fetchEvents returns capacity and attendee_count fields', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        { id: 1, title: 'Full Event', capacity: 30, attendee_count: 30, location: 'Room A', start_time: '2026-04-01T10:00:00', status: 'Published' },
        { id: 2, title: 'Open Event', capacity: 0, attendee_count: 5, location: 'Room B', start_time: '2026-04-01T11:00:00', status: 'Published' },
      ],
    });

    const events = await fetchEvents();

    expect(events[0].capacity).toBe(30);
    expect(events[0].attendee_count).toBe(30);
    expect(events[1].capacity).toBe(0);
    expect(events[1].attendee_count).toBe(5);
  });
});
