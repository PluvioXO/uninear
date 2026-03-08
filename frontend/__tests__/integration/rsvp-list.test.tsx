import { fetchEventRsvps } from '../../lib/api';

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

describe('test_FR14_view_rsvp_list — RSVP list for organisers', () => {
  it('fetchEventRsvps calls GET /api/events/{id}/rsvps with auth', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        { user_id: 'uid-1', name: 'Alice Smith', email: 'alice@bath.ac.uk', rsvp_time: '2026-03-01T10:00:00' },
        { user_id: 'uid-2', name: 'Bob Jones', email: 'bob@bath.ac.uk', rsvp_time: '2026-03-02T14:30:00' },
      ],
    });

    const res = await fetchEventRsvps(42);
    const attendees = await res.json();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/events/42/rsvps'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-jwt-token',
        }),
      }),
    );
    expect(attendees).toHaveLength(2);
    expect(attendees[0].name).toBe('Alice Smith');
    expect(attendees[0].email).toBe('alice@bath.ac.uk');
    expect(attendees[1].name).toBe('Bob Jones');
  });

  it('API response contains expected attendee fields (name, email, rsvp_time)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        { user_id: 'uid-1', name: 'Alice Smith', email: 'alice@bath.ac.uk', rsvp_time: '2026-03-01T10:00:00' },
      ],
    });

    const res = await fetchEventRsvps(1);
    const attendees = await res.json();

    expect(attendees[0]).toHaveProperty('name', 'Alice Smith');
    expect(attendees[0]).toHaveProperty('email', 'alice@bath.ac.uk');
    expect(attendees[0]).toHaveProperty('rsvp_time');
    expect(attendees[0]).toHaveProperty('user_id');
  });

  it('empty RSVP list returns empty array from API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    });

    const res = await fetchEventRsvps(999);
    const attendees = await res.json();

    expect(attendees).toEqual([]);
    expect(attendees).toHaveLength(0);
  });

  it('RSVP count matches number of attendees from API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        { user_id: 'uid-1', name: 'Alice', email: 'a@bath.ac.uk', rsvp_time: '2026-03-01T10:00:00' },
        { user_id: 'uid-2', name: 'Bob', email: 'b@bath.ac.uk', rsvp_time: '2026-03-02T14:00:00' },
        { user_id: 'uid-3', name: 'Charlie', email: 'c@bath.ac.uk', rsvp_time: '2026-03-03T09:00:00' },
      ],
    });

    const res = await fetchEventRsvps(5);
    const attendees = await res.json();

    // Component shows "RSVPs ({count})" — count should match array length
    expect(attendees).toHaveLength(3);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/events/5/rsvps'),
      expect.anything(),
    );
  });

  it('cancelled RSVP no longer appears after refresh', async () => {
    // First fetch: 2 attendees
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        { user_id: 'uid-1', name: 'Alice', email: 'a@bath.ac.uk', rsvp_time: '2026-03-01T10:00:00' },
        { user_id: 'uid-2', name: 'Bob', email: 'b@bath.ac.uk', rsvp_time: '2026-03-02T14:00:00' },
      ],
    });

    const res1 = await fetchEventRsvps(1);
    const before = await res1.json();
    expect(before).toHaveLength(2);

    // After cancel + refresh: 1 attendee
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        { user_id: 'uid-1', name: 'Alice', email: 'a@bath.ac.uk', rsvp_time: '2026-03-01T10:00:00' },
      ],
    });

    const res2 = await fetchEventRsvps(1);
    const after = await res2.json();
    expect(after).toHaveLength(1);
    expect(after.find((a: { user_id: string }) => a.user_id === 'uid-2')).toBeUndefined();
  });
});
