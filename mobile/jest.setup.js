import { jest } from '@jest/globals';

// Mock expo-calendar
jest.mock('expo-calendar', () => ({
  requestCalendarPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCalendarsAsync: jest.fn(() => Promise.resolve([])),
  createEventAsync: jest.fn(() => Promise.resolve('event_id')),
  EntityTypes: {
    EVENT: 'event',
  },
}));

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  class MockMapView extends React.Component {
    render() {
      return React.createElement(View, { testID: 'map-view' }, this.props.children);
    }
  }
  MockMapView.Marker = (props) => React.createElement(View, { testID: 'map-marker' }, props.children);
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMapView.Marker,
    PROVIDER_GOOGLE: 'google',
  };
});

// Mock expo-modules-core
jest.mock('expo-modules-core', () => {
    const actual = jest.requireActual('expo-modules-core');
    return {
      ...actual,
      NativeModulesProxy: {},
      EventEmitter: jest.fn(),
    };
});

// Mock expo
// Mock expo
jest.mock('expo', () => {
    return {
      registerRootComponent: jest.fn(),
    };
}, { virtual: true });
