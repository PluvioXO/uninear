import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import App from './App';

jest.setTimeout(15000);

describe('test_profile_email_readonly - Mobile Profile', () => {
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

  async function navigateToProfileEdit() {
    render(<App />);

    fireEvent.changeText(screen.getByPlaceholderText('you@bath.ac.uk'), 'test@bath.ac.uk');
    fireEvent.changeText(screen.getByPlaceholderText('Minimum 8 characters'), 'password123');
    fireEvent.press(screen.getByText('Log In'));

    expect(await screen.findByText('Welcome back,', {}, { timeout: 10000 })).toBeTruthy();
    expect(await screen.findByText('Test Event', {}, { timeout: 10000 })).toBeTruthy();

    // Navigate to Profile tab
    fireEvent.press(screen.getAllByText('Profile')[0]);

    // Press Edit Profile
    fireEvent.press(screen.getByText('Edit Profile'));
  }

  it('AC1: email input is read-only in profile edit', async () => {
    await navigateToProfileEdit();

    const emailInput = screen.getByDisplayValue('test@bath.ac.uk');
    expect(emailInput.props.editable).toBe(false);
  });

  it('AC2: shows helper text that email cannot be changed', async () => {
    await navigateToProfileEdit();

    expect(
      screen.getByText('Email is managed by your account and cannot be changed here.')
    ).toBeTruthy();
  });

  it('AC3: trying to change email does not update displayed value', async () => {
    await navigateToProfileEdit();

    const emailInput = screen.getByDisplayValue('test@bath.ac.uk');
    fireEvent.changeText(emailInput, 'newuser@bath.ac.uk');
    expect(screen.getByDisplayValue('test@bath.ac.uk')).toBeTruthy();
  });
});
