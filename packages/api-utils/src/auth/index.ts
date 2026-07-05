// Auth utilities for Spriggle.
//
// Multi-issuer JWT verification (Apple for MVP) is the app-facing API. The
// multi-issuer shape allows adding providers later without changing callers.
export {
  verifyToken,
  getAuthUser,
  requireAuth,
  getUser,
  defaultVerifiers,
  resetVerifiers,
  buildAppleVerifier,
  type AuthenticatedUser,
  type VerifiedProvider,
  type ProviderVerifier,
} from "./multiProvider";
