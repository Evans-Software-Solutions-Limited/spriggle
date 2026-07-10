// Shared manual mock for react-native-reanimated (auto-applied by Jest for this
// node module). The native worklet runtime can't run under the jest-expo Node
// preset, so animation primitives are reduced to identity functions and shared
// values to plain `{ value }` holders. Animation *timing* in the app is driven
// by useGameAnimations' own setTimeout sequencing, not by these callbacks, so
// tests don't depend on completion callbacks firing.
const { View, Text } = require("react-native");

const passthrough = (value) => value;

module.exports = {
  __esModule: true,
  default: {
    createAnimatedComponent: (Component) => Component,
    View,
    Text,
  },
  useSharedValue: (initial) => ({ value: initial }),
  useAnimatedStyle: (factory) => factory(),
  useDerivedValue: (factory) => ({ value: factory() }),
  withTiming: passthrough,
  withSpring: passthrough,
  withRepeat: passthrough,
  withSequence: (...args) => args[0],
  withDelay: (_delay, value) => value,
  runOnJS: (fn) => fn,
  cancelAnimation: () => {},
  Easing: {
    linear: passthrough,
    ease: {},
    in: (e) => e,
    out: (e) => e,
    inOut: (e) => e,
    back: () => ({}),
    bezier: () => ({}),
  },
};
