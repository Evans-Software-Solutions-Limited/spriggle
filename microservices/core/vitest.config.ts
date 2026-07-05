import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      include: [
        "src/application/**/*.ts",
        "src/**/repositories/*.ts",
        "src/shared/**/*.ts",
      ],
      exclude: [
        "node_modules",
        "**/*.test.ts",
        "**/vitest.config.ts",
        "**/sst-env.d.ts",
        "src/api.ts",
        "src/index.ts",
      ],
      // Target 90% coverage
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
});
