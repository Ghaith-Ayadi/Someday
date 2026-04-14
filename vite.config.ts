import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        proxy: {
            "/tmdb": {
                target: "https://api.themoviedb.org/3",
                changeOrigin: true,
                rewrite: (p) => p.replace(/^\/tmdb/, ""),
            },
        },
    },
});
