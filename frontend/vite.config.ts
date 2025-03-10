import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
      },
    },
    server: {
      host: "0.0.0.0",
      port: 3000,
      proxy: {
        "/movies": {
          target: env.BACKEND_URL || "http://backend:3000",
          changeOrigin: true,
          secure: false,
        },
        "/socket.io": {
          target: env.BACKEND_URL || "http://backend:3000",
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
    build: {
      sourcemap: true,
      rollupOptions: {
        // Skip type check during build
        external: mode === "production" ? [] : ["**/*.test.*"],
      },
    },
    define: {
      "import.meta.env.VITE_BUILD_TIME": JSON.stringify(
        new Date().toISOString()
      ),
    },
  };
});
