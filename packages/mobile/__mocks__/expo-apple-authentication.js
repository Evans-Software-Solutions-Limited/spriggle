// Manual Jest mock for `expo-apple-authentication`.
//
// Native Apple Sign-In module; unavailable under the jest-expo (Node) preset.
// `signInAsync` resolves to a minimal credential by default; override per-test.
/* global jest */
const AppleAuthenticationScope = {
  FULL_NAME: 0,
  EMAIL: 1,
};

const signInAsync = jest.fn(async () => ({
  user: "apple-user-123",
  identityToken: "mock.apple.identity.token",
  fullName: { givenName: "Test", familyName: "Gardener" },
  email: "test@example.com",
}));

module.exports = {
  AppleAuthenticationScope,
  signInAsync,
};
