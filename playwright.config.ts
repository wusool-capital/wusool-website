import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  use: { baseURL: "http://localhost:8787" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npx wrangler dev --port 8787",
    url: "http://localhost:8787",
    reuseExistingServer: !process.env.CI,
  },
});
