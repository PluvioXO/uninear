import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import App from './App';

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

      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: 'Not found' }),
      });
    });
  });

  it('renders the event list after loading', async () => {
    render(<App />);

    fireEvent.changeText(screen.getByPlaceholderText('you@bath.ac.uk'), 'test@bath.ac.uk');
    fireEvent.changeText(screen.getByPlaceholderText('Minimum 8 characters'), 'password123');
    fireEvent.press(screen.getByText('Log In'));

    // Wait for the event title to appear
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeTruthy();
    }, { timeout: 3000 });
    
    expect(screen.getByText('Welcome back,')).toBeTruthy();
  });
});
