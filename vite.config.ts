import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `base: "./"` makes every asset URL relative, so the build works on GitHub Pages
// no matter what the repository is called (https://<user>.github.io/<any-repo-name>/).
export default defineConfig({
  base: "./",
  plugins: [react()],
});
