// Manual Jest mock for `expo-haptics` (native module; can't run under the
// jest-expo Node preset). Feedback calls are no-op async; the enums mirror the
// real module so call sites referencing them don't throw.
module.exports = {
  notificationAsync: async () => {},
  impactAsync: async () => {},
  selectionAsync: async () => {},
  NotificationFeedbackType: {
    Success: "success",
    Warning: "warning",
    Error: "error",
  },
  ImpactFeedbackStyle: {
    Light: "light",
    Medium: "medium",
    Heavy: "heavy",
    Soft: "soft",
    Rigid: "rigid",
  },
};
