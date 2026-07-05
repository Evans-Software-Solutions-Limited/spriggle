/**
 * Jest config for Detox E2E specs (separate from the unit-test config in
 * package.json). Runs `*.e2e.ts` under e2e/ against a running app via Detox's
 * jest environment. Serial (maxWorkers: 1) — one simulator.
 */
/** @type {import('jest').Config} */
module.exports = {
  rootDir: "..",
  testMatch: ["<rootDir>/e2e/**/*.e2e.ts"],
  testTimeout: 180000,
  maxWorkers: 1,
  globalSetup: "detox/runners/jest/globalSetup",
  globalTeardown: "detox/runners/jest/globalTeardown",
  reporters: ["detox/runners/jest/reporter"],
  testEnvironment: "detox/runners/jest/testEnvironment",
  verbose: true,
  transform: {
    "^.+\\.[tj]sx?$": "babel-jest",
  },
};
