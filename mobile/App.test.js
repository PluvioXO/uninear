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
              title: 'Test Event',
              start_time: '2026-10-15T09:00:00Z',
              location: 'Test Location',
              status: 'Published',
              latitude: 0,
              longitude: 0,
              moods: [],
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

    expect(await screen.findByText('Test Event', {}, { timeout: 10000 })).toBeTruthy();
    
    expect(screen.getByText('Welcome back,')).toBeTruthy();
  });
});
