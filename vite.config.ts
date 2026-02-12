/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";
import { configDefaults } from "vitest/config";

export default defineConfig({
  plugins: [react(), svgr(), tsconfigPaths()],
  test: {
    exclude: [...configDefaults.exclude, "**/__tests__/**"],
  },
});
