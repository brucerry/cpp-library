import { defineConfig } from "vite";

export default defineConfig({
    base: "./",
    optimizeDeps: { entries: ["index.html"] },
    server: {
        watch: {
            // Archive extraction and reference imports create thousands of files.
            // The app revalidates the catalog itself; these are not HMR inputs.
            ignored: ["**/.tmp/**", "**/public/data/**", "**/test-results/**"],
        },
    },
});
