import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import App from './App';

jest.setTimeout(15000);

describe('App', () => {
  beforeEach(() => {
    global.fetch = jest.fn((url) => {
      if (String(url).includes('/auth/login')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            session: {
              access_token: 'test-token',
              user: {
                id: 'user-123',
                email: 'test@bath.ac.uk',
                user_metadata: { full_name: 'Test User' },
              },
            },
          }),
        });
      }

      if (String(url).includes('/events')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve(''),
          json: () => Promise.resolve([
            {
              id: 1,
              title: 'Social Event',
              start_time: '2026-10-15T09:00:00Z',
              location: 'Test Location',
              status: 'Published',
              latitude: 0,
              longitude: 0,
              mood_tags: ['Social'],
              energy_level: 'High',
              friends_attending: [],
            },
            {
              id: 2,
              title: 'Focused Event',
              start_time: '2026-10-16T09:00:00Z',
              location: 'Library',
              status: 'Published',
              latitude: 0,
              longitude: 0,
              mood_tags: ['Focused'],
              energy_level: 'medium',
              friends_attending: [],
            },
          ]),
        });
      }

      if (String(url).includes('/api/rsvp')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([]),
        });
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });
    });
  });

  it('renders the event list after loading', async () => {
    render(<App />);

    fireEvent.changeText(screen.getByPlaceholderText('you@bath.ac.uk'), 'test@bath.ac.uk');
    fireEvent.changeText(screen.getByPlaceholderText('Minimum 8 characters'), 'password123');
    fireEvent.press(screen.getByText('Log In'));

    expect(await screen.findByText('Social Event', {}, { timeout: 10000 })).toBeTruthy();
    
    expect(screen.getByText('Welcome back,')).toBeTruthy();
  });

  it('filters events using backend mood_tags values', async () => {
    render(<App />);

    fireEvent.changeText(screen.getByPlaceholderText('you@bath.ac.uk'), 'test@bath.ac.uk');
    fireEvent.changeText(screen.getByPlaceholderText('Minimum 8 characters'), 'password123');
    fireEvent.press(screen.getByText('Log In'));

    expect(await screen.findByText('Social Event', {}, { timeout: 10000 })).toBeTruthy();
    expect(screen.getByText('Focused Event')).toBeTruthy();

    fireEvent.press(screen.getByText('Filter'));
    fireEvent.press(screen.getByText('Social'));

    expect(screen.getByText('Show 1 event')).toBeTruthy();
    fireEvent.press(screen.getByText('Show 1 event'));

    expect(await screen.findByText('Social Event')).toBeTruthy();
    expect(screen.queryByText('Focused Event')).toBeNull();
  });
});
