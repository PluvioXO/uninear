// Mock expo-calendar
jest.mock('expo-calendar', () => ({
  requestCalendarPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCalendarsAsync: jest.fn(() => Promise.resolve([])),
  createEventAsync: jest.fn(() => Promise.resolve('event_id')),
  EntityTypes: {
    EVENT: 'event',
  },
}));

// Mock SafeAreaView from react-native with a plain View to avoid deprecation crash
jest.mock('react-native/Libraries/Components/SafeAreaView/SafeAreaView', () => {
  const React = require('react');
  const { View } = require('react-native');
  return (props) => React.createElement(View, props);
});

// Suppress SafeAreaView deprecation warning
jest.mock('react-native/Libraries/Utilities/warnOnce', () => ({
  default: jest.fn(),
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
  const MockCallout = (props) => React.createElement(View, { testID: 'map-callout' }, props.children);
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMapView.Marker,
    Callout: MockCallout,
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
