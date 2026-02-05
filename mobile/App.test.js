import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import App from './App';

// Mock global fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    text: () => Promise.resolve(''),
    json: () => Promise.resolve([
      {
        id: 1,
        title: 'Test Event',
        date: '2025-10-15T09:00:00',
        location: 'Test Location',
        price: 10,
        status: 'Published',
        // Add minimal required fields to avoid render crashes
        latitude: 0,
        longitude: 0, 
        moods: [],
        energy_level: 'medium',
        friends_attending: []
      }
    ]),
  })
);

describe('App', () => {
  it('renders the event list after loading', async () => {
    const component = render(<App />);

    // Wait for the event title to appear
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeTruthy();
    }, { timeout: 3000 });
    
    expect(screen.getByText('Welcome back,')).toBeTruthy();
  });
});
