import { apiFetch, fetchEvents, formatEventFetchErrorMessage } from '../../lib/api';

// Mock auth.ts getToken
jest.mock('../../lib/auth', () => ({
  getToken: jest.fn(),
}));

import { getToken } from '../../lib/auth';
const mockGetToken = getToken as jest.MockedFunction<typeof getToken>;

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
});

describe('apiFetch', () => {
  it('attaches Authorization header when token exists', async () => {
    mockGetToken.mockResolvedValue('test-jwt-token');

    await apiFetch('/events');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/events'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-jwt-token',
        }),
      }),
    );
  });

  it('throws when no token is available', async () => {
    mockGetToken.mockResolvedValue(null);

    await expect(apiFetch('/events')).rejects.toThrow(
      'Not authenticated',
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('sets Content-Type to application/json by default', async () => {
    mockGetToken.mockResolvedValue('token');

    await apiFetch('/events');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('passes through request options', async () => {
    mockGetToken.mockResolvedValue('token');

    await apiFetch('/events', { method: 'POST', body: '{"title":"Test"}' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: '{"title":"Test"}',
      }),
    );
  });
});

describe('fetchEvents', () => {
  it('includes backend detail in the thrown error message', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      text: async () => JSON.stringify({ detail: 'Unable to load events' }),
    });

    await expect(fetchEvents()).rejects.toThrow(
      'Failed to fetch events (503 Service Unavailable): Unable to load events',
    );
  });

  it('includes the original network error reason', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(fetchEvents()).rejects.toThrow(
      'Failed to fetch events: Failed to fetch',
    );
  });

  it('includes plain-text backend responses in the thrown error message', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      text: async () => 'upstream timeout',
    });

    await expect(fetchEvents()).rejects.toThrow(
      'Failed to fetch events (502 Bad Gateway): upstream timeout',
    );
  });
});

describe('formatEventFetchErrorMessage', () => {
  it('does not double-prefix an existing fetch error message', () => {
    expect(
      formatEventFetchErrorMessage(new Error('Failed to fetch events: Network error')),
    ).toBe('Failed to fetch events: Network error');
  });
});
