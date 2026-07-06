module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          alias: {
            "@": "./src",
          },
        },
      ],
      // Reanimated 4 moved its Babel plugin into react-native-worklets; must be last.
      "react-native-worklets/plugin",
    ],
  };
};
