import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages sert le site sous /<nom-du-dépôt>/ : le workflow passe VITE_BASE.
export default defineConfig({
  base: process.env.VITE_BASE ?? "/Wikiveille-afrique/",
  plugins: [react()],
  build: { target: "es2020", sourcemap: true },
});
