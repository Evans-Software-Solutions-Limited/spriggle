// Manual Jest mock for `expo-linear-gradient` — renders as a plain View so
// children (the board grid/cells) still mount under the jest-expo Node preset.
const { View } = require("react-native");

module.exports = {
  LinearGradient: View,
};
