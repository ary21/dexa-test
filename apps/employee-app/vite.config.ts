import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({ org: 'attendance', project: 'employee-app', disable: !process.env.SENTRY_AUTH_TOKEN }),
  ],
  build: { sourcemap: true },
  server: { port: 3001 },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  },
});
