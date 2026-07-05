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
 * (persistencemobile).
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
      binaryPath:
        "ios/build/Build/Products/Debug-iphonesimulator/persistencemobile.app",
      build:
        "xcodebuild -workspace ios/persistencemobile.xcworkspace -scheme persistencemobile -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build -quiet",
    },
    "ios.release": {
      type: "ios.app",
      binaryPath:
        "ios/build/Build/Products/Release-iphonesimulator/persistencemobile.app",
      build:
        "xcodebuild -workspace ios/persistencemobile.xcworkspace -scheme persistencemobile -configuration Release -sdk iphonesimulator -derivedDataPath ios/build -quiet",
    },
  },
  devices: {
    simulator: {
      type: "ios.simulator",
      device: {
        // iPad target (landscape-only game). Adjust to an installed simulator.
        type: "iPad Pro (12.9-inch) (6th generation)",
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
