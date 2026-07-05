// Manual Jest mock for `expo-secure-store`.
//
// expo-secure-store is a native module (keychain/keystore) that can't run under
// the jest-expo (Node) preset. This mock backs it with an in-process Map so
// token store/retrieve round-trips are exercised in tests.
//
// The store is module-scoped, so it persists across calls within a test file.
// Call `__resetSecureStore()` between tests when isolation is needed.
const store = new Map();

async function getItemAsync(key) {
  return store.has(key) ? store.get(key) : null;
}

async function setItemAsync(key, value) {
  store.set(key, String(value));
}

async function deleteItemAsync(key) {
  store.delete(key);
}

function __resetSecureStore() {
  store.clear();
}

module.exports = {
  getItemAsync,
  setItemAsync,
  deleteItemAsync,
  __resetSecureStore,
};
