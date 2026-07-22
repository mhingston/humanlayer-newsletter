import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["test/integration.test.ts"],
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
