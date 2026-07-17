import { defineConfig } from 'vitest/config'

// Separate config for the Firestore rules tests: Node environment, and it
// includes only the rules spec (which requires the emulator). Run via
// `npm run test:rules`, which wraps this in `firebase emulators:exec`.
export default defineConfig({
  test: {
    include: ['firestore.rules.test.ts'],
    environment: 'node',
  },
})
