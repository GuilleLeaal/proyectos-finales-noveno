import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteGradeAccess } from "./server/vite-grade-access.mjs";

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), viteGradeAccess(mode)],
}));
