import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        // Configuration files
        "**/node_modules/**",
        "**/dist/**",
        "**/eslint.config.js",
        "**/jest.config.js",
        "**/tailwind.config.js",
        "**/vite.config.ts",
        "**/vitest.config.ts",

        // Test utilities
        "**/setupTests.ts",
        "**/testUtils.tsx",

        // Type definitions
        "**/*.d.ts",

        // Generated files
        "**/build/**",
        "**/.git/**",

        // Test files
        "**/*.test.{js,jsx,ts,tsx}",
        "**/*.spec.{js,jsx,ts,tsx}",
        "**/__tests__/**",
        "**/__mocks__/**",
      ],
      // Only include source files for coverage
      include: ["src/**/*.{js,jsx,ts,tsx}"],
      // Thresholds to maintain
      thresholds: {
        lines: 60,
        functions: 55,
        branches: 75,
        statements: 60,
      },
    },
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["node_modules", "dist", ".idea", ".git", ".cache"],
    typecheck: {
      enabled: true,
      tsconfig: "./tsconfig.vitest.json",
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
