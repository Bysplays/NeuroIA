import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '.', testMatch: '*.spec.mjs', fullyParallel: false, workers: 1,
  reporter: 'list', outputDir: '/tmp/neuroia-placement-test-results',
  use: { baseURL: 'http://127.0.0.1:5197', headless: true },
  webServer: { cwd: new URL('../../', import.meta.url).pathname, command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5197 --strictPort --mode placement-test', url: 'http://127.0.0.1:5197/tests/placement/index.html', reuseExistingServer: true },
});
