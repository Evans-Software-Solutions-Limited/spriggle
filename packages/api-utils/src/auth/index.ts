// Auth utilities for Spriggle.
//
// Multi-provider JWT verification (Apple + Supabase/email for MVP) is the
// app-facing API. The Supabase-specific helpers remain available for reference
// under their own names via ./supabaseAuth.
export {
  verifyToken,
  getAuthUser,
  requireAuth,
  getUser,
  defaultVerifiers,
  resetVerifiers,
  buildAppleVerifier,
  buildSupabaseVerifier,
  type AuthenticatedUser,
  type VerifiedProvider,
  type ProviderVerifier,
} from "./multiProvider";

export { type SupabaseUser } from "./supabaseAuth";
