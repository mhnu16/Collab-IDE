import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

let server_config = {
  host: "127.0.0.1",
  port: 3000,
  strictPort: true,
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: "frontend",
  server: server_config,
  preview: server_config,
});
