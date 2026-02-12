import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
  // Monorepo: keep env vars in repo root `.env` (only `VITE_*` are exposed to the client).
  envDir: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'),
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
  },
});
