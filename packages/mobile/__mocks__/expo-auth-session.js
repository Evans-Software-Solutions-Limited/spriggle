// Manual Jest mock for `expo-auth-session`.
//
// OAuth helper that relies on native browser/crypto; unavailable under
// jest-expo. Provides the small surface the Facebook provider uses. By default
// promptAsync resolves to a cancellation so tests don't hit the network;
// override with jest.spyOn(AuthRequest.prototype, "promptAsync") when a
// success path is under test.
const ResponseType = {
  Token: "token",
  Code: "code",
};

function makeRedirectUri(options = {}) {
  return `${options.scheme || "app"}://redirect`;
}

class AuthRequest {
  constructor(config) {
    this.config = config;
  }

  async promptAsync() {
    return { type: "cancel" };
  }
}

module.exports = {
  ResponseType,
  makeRedirectUri,
  AuthRequest,
};
