import NetInfo from "@react-native-community/netinfo";

import { getSyncService, type SyncService } from "./SyncService";

/**
 * Subscribe to connectivity changes and auto-drain the sync queue when the
 * device comes back online (Requirement 13.2). Returns an unsubscribe function.
 *
 * Wire this once near app start (e.g. in the root layout effect).
 */
export function startConnectivitySync(
  service: SyncService = getSyncService(),
): () => void {
  return NetInfo.addEventListener((state) => {
    service.onConnectivityChange(state.isConnected === true);
  });
}
