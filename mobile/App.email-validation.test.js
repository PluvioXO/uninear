import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
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
        latitude: 0,
        longitude: 0,
        moods: [],
        energy_level: 'medium',
        friends_attending: []
      }
    ]),
  })
);

describe('test_NFR07_bath_email_validation - Mobile Profile', () => {
  async function navigateToProfileEdit() {
    render(<App />);

    // Wait for app to load
    await waitFor(() => {
      expect(screen.getByText('Welcome back,')).toBeTruthy();
    }, { timeout: 3000 });

    // Navigate to Profile tab
    fireEvent.press(screen.getByText('Profile'));

    // Press Edit Profile
    fireEvent.press(screen.getByText('Edit Profile'));
  }

  it('AC1: shows error for non-bath email in profile edit', async () => {
    await navigateToProfileEdit();

    // Find email input and change to non-bath email
    const emailInputs = screen.getAllByDisplayValue(/bath\.ac\.uk/i);
    fireEvent.changeText(emailInputs[0], 'user@gmail.com');

    expect(screen.getByText('Only @bath.ac.uk emails are allowed')).toBeTruthy();
  });

  it('AC1: Save button disabled for non-bath email', async () => {
    await navigateToProfileEdit();

    const emailInputs = screen.getAllByDisplayValue(/bath\.ac\.uk/i);
    fireEvent.changeText(emailInputs[0], 'user@gmail.com');

    const saveButton = screen.getByText('Save');
    // Walk up to the TouchableOpacity parent that carries the disabled prop
    const touchable = saveButton.parent.parent;
    expect(touchable.props.accessibilityState?.disabled).toBe(true);
  });

  it('AC2: no error for valid bath email', async () => {
    await navigateToProfileEdit();

    const emailInputs = screen.getAllByDisplayValue(/bath\.ac\.uk/i);
    fireEvent.changeText(emailInputs[0], 'newuser@bath.ac.uk');

    expect(screen.queryByText('Only @bath.ac.uk emails are allowed')).toBeNull();
  });
});
