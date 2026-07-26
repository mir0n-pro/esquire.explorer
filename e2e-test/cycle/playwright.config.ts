import 'dotenv/config';
import { defineConfig } from '@playwright/test';

// The full-lifecycle CYCLE job (soak / activity generator), separate from the functional suite in ../tests.
// Same auth + /api session as e2e-test; drives the SPA through N complete lifecycles under the Test House.
// CYCLES sets how many laps (default 3). Per-lap timeout is generous -- a lap opens many dialogs and warms
// several services; a cold pod or GC spike must not fail a soak lap.
export default defineConfig({
  testDir: '.',
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 15 * 60_000,
  use: {
    baseURL: process.env['BASE_URL'] ?? 'http://localhost:4200',
    headless: true,
    trace: 'off',
  },
  reporter: [['list']],
});
