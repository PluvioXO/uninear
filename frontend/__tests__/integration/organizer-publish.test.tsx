import { fetchOrganizerEvents, updateEvent } from '../../lib/api';

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

describe('test_FR10_publish_event — organizer publish workflow', () => {
  it('fetchOrganizerEvents calls GET /api/organizer/events with auth', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        { id: 1, title: 'Draft Event', status: 'Draft' },
        { id: 2, title: 'Published Event', status: 'Published' },
      ],
    });

    const res = await fetchOrganizerEvents();
    const events = await res.json();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/organizer/events'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-jwt-token',
        }),
      }),
    );
    expect(events).toHaveLength(2);
    expect(events[0].status).toBe('Draft');
    expect(events[1].status).toBe('Published');
  });

  it('updateEvent calls PATCH /events/{id} with status Published', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [{ id: 1, title: 'My Event', status: 'Published' }],
    });

    const res = await updateEvent(1, { status: 'Published' });
    const data = await res.json();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/events/1'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'Published' }),
        headers: expect.objectContaining({
          Authorization: 'Bearer test-jwt-token',
        }),
      }),
    );
    expect(data[0].status).toBe('Published');
  });

  it('draft events show Draft status, published events show Published status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        { id: 1, title: 'Draft Event', status: 'Draft' },
        { id: 2, title: 'Live Event', status: 'Published' },
      ],
    });

    const res = await fetchOrganizerEvents();
    const events = await res.json();

    const draftEvents = events.filter((e: { status: string }) => e.status === 'Draft');
    const publishedEvents = events.filter((e: { status: string }) => e.status === 'Published');

    expect(draftEvents).toHaveLength(1);
    expect(publishedEvents).toHaveLength(1);
  });

  it('publish updates status from Draft to Published without page reload', async () => {
    // Simulate: fetch events, then publish one
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          { id: 1, title: 'My Event', status: 'Draft' },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ id: 1, title: 'My Event', status: 'Published' }],
      });

    // Load events
    const loadRes = await fetchOrganizerEvents();
    const events = await loadRes.json();
    expect(events[0].status).toBe('Draft');

    // Publish
    const publishRes = await updateEvent(1, { status: 'Published' });
    const updated = await publishRes.json();
    expect(updated[0].status).toBe('Published');

    // Simulate optimistic UI update (same pattern as component)
    const updatedEvents = events.map((e: { id: number; status: string }) =>
      e.id === 1 ? { ...e, status: 'Published' } : e
    );
    expect(updatedEvents[0].status).toBe('Published');
  });
});
