import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import symfonyPlugin from "vite-plugin-symfony";

export default defineConfig({
    plugins: [react(), tailwindcss(), symfonyPlugin()],
    resolve: {
        alias: {
            "@": path.resolve(import.meta.dirname, "assets"),
        },
    },
    build: {
        rollupOptions: {
            input: {
                app: "./assets/main.tsx",
            },
        },
    },
});
