import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import App from './App';

// Mock global fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([
      {
        id: 1,
        title: 'Test Event',
        date: '2025-10-15T09:00:00',
        location: 'Test Location',
        price: 10,
        status: 'Published'
      }
    ]),
  })
);

describe('App', () => {
  it('renders the event list after loading', async () => {
    render(<App />);

    // Wait for the event title to appear
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeTruthy();
    });
    
    expect(screen.getByText('UniNear Events')).toBeTruthy();
  });
});
