import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import fs from "fs";

let server_config = {
  port: 3000,
  strictPort: true,
  https: {
    key: fs.readFileSync("./security/key.pem"),
    cert: fs.readFileSync("./security/cert.pem"),
    passphrase: fs.readFileSync("./security/.key", "utf-8"),
  },
  proxy: {
    "/api": {
      target: "https://localhost:5000",
      secure: false, // Doesn't verify the certificate because it's self-signed
    },
    "/socket.io": {
      target: "https://localhost:5000",
      secure: false, // Doesn't verify the certificate because it's self-signed
      ws: true,
    },
  },
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: server_config,
  preview: server_config,
});
