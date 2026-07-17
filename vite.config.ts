import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // rules tests need the Firestore emulator; run them via `npm run test:rules`
    exclude: [...configDefaults.exclude, '**/*.rules.test.ts'],
  },
})
