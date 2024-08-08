import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    testTimeout: 1000,
    hookTimeout: 1000,
    teardownTimeout: 1000,
    include: ["test/vitest/**/*.spec.ts"],
    coverage: {
      include: ["src/**/*.ts"],
    },
  },
});
