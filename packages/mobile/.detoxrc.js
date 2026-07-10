/**
 * Detox configuration for iPad E2E (Task 22).
 *
 * These flows run on an iOS simulator against a native build of the app — they
 * are heavy and are NOT part of the standard unit-test CI. They run on merge to
 * `main` (see .github/workflows/e2e.yml) and locally via:
 *
 *   bun run e2e:build   # xcodebuild the app once
 *   bun run e2e:test    # boot the simulator + run the specs
 *
 * The iOS scheme/workspace/app names come from the prebuilt ios/ project
 * (Spriggle — regenerate with `expo prebuild -p ios --clean` so the native
 * project matches app.json rather than the old persistence template).
 */
module.exports = {
  testRunner: {
    args: {
      $0: "jest",
      config: "e2e/jest.config.js",
    },
    jest: {
      setupTimeout: 180000,
    },
  },
  apps: {
    "ios.debug": {
      type: "ios.app",
      binaryPath: "ios/build/Build/Products/Debug-iphonesimulator/Spriggle.app",
      build:
        "xcodebuild -workspace ios/Spriggle.xcworkspace -scheme Spriggle -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build -quiet",
    },
    "ios.release": {
      type: "ios.app",
      binaryPath:
        "ios/build/Build/Products/Release-iphonesimulator/Spriggle.app",
      build:
        "xcodebuild -workspace ios/Spriggle.xcworkspace -scheme Spriggle -configuration Release -sdk iphonesimulator -derivedDataPath ios/build -quiet",
    },
  },
  devices: {
    simulator: {
      type: "ios.simulator",
      device: {
        // iPad target (landscape-only game). "iPad Pro 13-inch (M4)" is the
        // 13" iPad Pro simulator shipped with Xcode 26 (CI selects Xcode 26 —
        // Expo SDK 55 requires it; see .github/workflows/e2e.yml). Override
        // locally via DETOX_IPAD_DEVICE if your installed Xcode names it
        // differently.
        type: process.env.DETOX_IPAD_DEVICE || "iPad Pro 13-inch (M4)",
      },
    },
  },
  configurations: {
    "ios.sim.debug": {
      device: "simulator",
      app: "ios.debug",
    },
    "ios.sim.release": {
      device: "simulator",
      app: "ios.release",
    },
  },
};
