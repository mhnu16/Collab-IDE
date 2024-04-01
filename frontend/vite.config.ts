import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

let server_config = {
  port: 3000,
  strictPort: true,
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: server_config,
  preview: server_config,
});
