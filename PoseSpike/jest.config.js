/** Jest config: jest-expo preset for TypeScript/React Native tests. */
module.exports = {
  preset: 'jest-expo',
  // Shared fast-check generators live in __tests__ but are not test suites.
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/arbitraries\\.ts$'],
};
