// Manual Jest mock for AsyncStorage — uses the official in-memory mock shipped
// with the package (native module, unavailable under jest-expo).
module.exports = require("@react-native-async-storage/async-storage/jest/async-storage-mock");
