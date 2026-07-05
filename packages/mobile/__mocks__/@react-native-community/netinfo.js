// Manual Jest mock for `@react-native-community/netinfo`.
//
// Native connectivity module; unavailable under the jest-expo (Node) preset.
// addEventListener returns an unsubscribe fn; tests can capture the registered
// listener via the mock to simulate connectivity changes.
/* global jest */
const addEventListener = jest.fn(() => jest.fn());
const fetch = jest.fn(async () => ({
  isConnected: true,
  isInternetReachable: true,
}));

module.exports = {
  __esModule: true,
  default: { addEventListener, fetch },
  addEventListener,
  fetch,
};
