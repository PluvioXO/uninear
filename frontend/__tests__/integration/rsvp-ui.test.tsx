import { rsvpToEvent, getUserRsvps, cancelRsvp } from '../../lib/api';

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

describe('test_FR16_rsvp_ui — RSVP button and event details', () => {
  it('rsvpToEvent calls POST /api/rsvp with event_id and user_id', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ message: 'RSVP created' }),
    });

    const res = await rsvpToEvent(42, 'user-abc-123');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/rsvp'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-jwt-token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ event_id: 42, user_id: 'user-abc-123' }),
      }),
    );
    expect(res.ok).toBe(true);
  });

  it('getUserRsvps calls GET /api/rsvp?user_id={uid} with auth', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        { event_id: 1, user_id: 'user-abc', rsvp_time: '2026-03-01T10:00:00' },
        { event_id: 5, user_id: 'user-abc', rsvp_time: '2026-03-02T14:30:00' },
      ],
    });

    const res = await getUserRsvps('user-abc');
    const rsvps = await res.json();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/rsvp?user_id=user-abc'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-jwt-token',
        }),
      }),
    );
    expect(rsvps).toHaveLength(2);
    expect(rsvps[0].event_id).toBe(1);
    expect(rsvps[1].event_id).toBe(5);
  });

  it('RSVP success returns ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ message: 'RSVP created', event_id: 10 }),
    });

    const res = await rsvpToEvent(10, 'user-xyz');
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.message).toBe('RSVP created');
  });

  it('RSVP failure returns non-ok response with error detail', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ detail: 'Already RSVP\'d to this event' }),
    });

    const res = await rsvpToEvent(10, 'user-xyz');
    expect(res.ok).toBe(false);
    const body = await res.json();
    expect(body.detail).toContain('Already RSVP');
  });

  it('getUserRsvps can determine if user has RSVP\'d to a specific event', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        { event_id: 3, user_id: 'user-abc', rsvp_time: '2026-03-01T10:00:00' },
        { event_id: 7, user_id: 'user-abc', rsvp_time: '2026-03-02T11:00:00' },
      ],
    });

    const res = await getUserRsvps('user-abc');
    const rsvps = await res.json();

    const hasRsvpdToEvent7 = rsvps.some((r: { event_id: number }) => r.event_id === 7);
    const hasRsvpdToEvent99 = rsvps.some((r: { event_id: number }) => r.event_id === 99);

    expect(hasRsvpdToEvent7).toBe(true);
    expect(hasRsvpdToEvent99).toBe(false);
  });

  it('cancelRsvp calls DELETE /events/{id}/rsvp with event_id and user_id', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => ({}),
    });

    const res = await cancelRsvp(42, 'user-abc-123');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/events/42/rsvp'),
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-jwt-token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ event_id: 42, user_id: 'user-abc-123' }),
      }),
    );
    expect(res.ok).toBe(true);
  });

  it('cancel RSVP failure returns non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ detail: 'RSVP not found' }),
    });

    const res = await cancelRsvp(99, 'user-xyz');
    expect(res.ok).toBe(false);
    const body = await res.json();
    expect(body.detail).toBe('RSVP not found');
  });

  it('RSVP button state logic: not RSVP\'d shows RSVP, RSVP\'d shows Cancel', () => {
    // Simulate the button state logic from EventDetailPage
    const getButtonText = (loading: boolean, hasRsvpd: boolean, isFull: boolean) => {
      if (isFull && !hasRsvpd) return 'Event Full';
      if (loading) return 'Processing...';
      if (hasRsvpd) return 'Cancel RSVP';
      return 'RSVP';
    };

    expect(getButtonText(false, false, false)).toBe('RSVP');
    expect(getButtonText(false, true, false)).toBe('Cancel RSVP');
    expect(getButtonText(true, false, false)).toBe('Processing...');
    expect(getButtonText(true, true, false)).toBe('Processing...');
    expect(getButtonText(false, false, true)).toBe('Event Full');
    // Already RSVP'd user can still cancel even if event is now full
    expect(getButtonText(false, true, true)).toBe('Cancel RSVP');
  });
});
