import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: "./tests/browser",
    use: { baseURL: "http://127.0.0.1:4173", browserName: "chromium" },
    projects: [
        { name: "chromium" },
        {
            name: "webkit-touch",
            testMatch: "responsive.spec.js",
            use: { browserName: "webkit" },
        },
    ],
    webServer: {
        command: "npm run preview -- --port 4173 --strictPort",
        url: "http://127.0.0.1:4173",
        reuseExistingServer: !process.env.CI,
    },
});
