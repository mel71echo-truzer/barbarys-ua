const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testMatch: '**/visual-qa.spec.js',
  use: {
    launchOptions: {
      executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
