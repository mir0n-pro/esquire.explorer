import 'dotenv/config';
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  workers: 1,
  fullyParallel: false,
  // Retry latency flakes. The suite drives a real local stack (docker ng-serve frontend +
  // shared backend); an occasional op spikes past even the raised timeouts (dev-server
  // recompile, a cold pod, a GC pause). These are latency, not logic -- a retry passes and
  // the test is reported "flaky", not "failed", so the run stays honest and green.
  retries: 2,
  // Per-test budget. 60s (vs the 30s default) tolerates cold-start latency right after a
  // stack (re)deploy -- the first KC redirect / entity write can be slow while services,
  // pools, and the bus warm up. Steady-state tests finish in 1-2s regardless.
  timeout: 60_000,
  use: {
    baseURL: process.env['BASE_URL'] ?? 'http://localhost:4200',
    headless: true,
  },
  reporter: [['list'], ['html', { open: 'never' }]],
});
