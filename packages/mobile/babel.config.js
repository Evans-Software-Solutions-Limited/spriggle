module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // NOTE: The @tamagui/babel-plugin will be re-added here alongside a
      // real tamagui.config.ts when the UI layer is built (tasks 10-13).
      // It was removed because the persistence-template config it pointed
      // at referenced theme files that don't exist in spriggle yet.
      "react-native-reanimated/plugin", // must be last
    ],
  };
};
