// Manual Jest mock for `expo-web-browser`.
//
// Native module for in-app browser sessions; unavailable under jest-expo.
// The auth providers only call maybeCompleteAuthSession() at import time.
/* global jest */
module.exports = {
  maybeCompleteAuthSession: jest.fn(() => ({ type: "success" })),
  openAuthSessionAsync: jest.fn(async () => ({ type: "dismiss" })),
  dismissAuthSession: jest.fn(),
};
