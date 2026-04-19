import 'dotenv/config';
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: 'http://localhost:4200',
    headless: true,
  },
  reporter: [['list'], ['html', { open: 'never' }]],
});
