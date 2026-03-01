const path = require('path');

module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.preSetup.js'],
  setupFilesAfterEnv: ['./jest.setup.js'],
  moduleNameMapper: {
    // Mock all of expo's winter runtime to prevent ES import errors in lazy getters
    '^expo/src/winter/.*$': '<rootDir>/__mocks__/expo-installGlobal.js',
    // Mock the problematic expo entry files that pull in winter runtime
    '^expo/src/Expo\\.fx$': '<rootDir>/__mocks__/expo-installGlobal.js',
    '^expo/src/Expo\\.fx\\.tsx$': '<rootDir>/__mocks__/expo-installGlobal.js',
    '^@ungap/structured-clone$': '<rootDir>/__mocks__/structured-clone.js',
  }
};
