import { readFileSync } from 'node:fs'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

// Runs against the Firestore emulator — see `npm run test:rules`.
const PROJECT_ID = 'demo-renovator'
const EMPTY_DATA = JSON.stringify({
  schemaVersion: 1,
  tasks: [],
  purchases: [],
  contacts: [],
  categories: [],
  rooms: [],
  settings: {},
})

let testEnv: RulesTestEnvironment

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

beforeEach(async () => {
  await testEnv.clearFirestore()
  // provision the board with an allowlist, bypassing rules
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'boards', 'main'), {
      allowedEmails: ['allowed@example.com'],
      data: EMPTY_DATA,
    })
  })
})

const member = () =>
  testEnv.authenticatedContext('member-uid', { email: 'allowed@example.com' }).firestore()
const stranger = () =>
  testEnv.authenticatedContext('stranger-uid', { email: 'nope@example.com' }).firestore()
const anon = () => testEnv.unauthenticatedContext().firestore()

describe('board security rules', () => {
  it('lets an allow-listed user read the board', async () => {
    await assertSucceeds(getDoc(doc(member(), 'boards', 'main')))
  })

  it('denies a signed-in user who is not allow-listed', async () => {
    await assertFails(getDoc(doc(stranger(), 'boards', 'main')))
  })

  it('denies an anonymous user', async () => {
    await assertFails(getDoc(doc(anon(), 'boards', 'main')))
  })

  it('lets an allow-listed user update the board data', async () => {
    await assertSucceeds(updateDoc(doc(member(), 'boards', 'main'), { data: EMPTY_DATA }))
  })

  it('forbids changing the allowlist through the client', async () => {
    await assertFails(
      updateDoc(doc(member(), 'boards', 'main'), {
        allowedEmails: ['allowed@example.com', 'sneaky@example.com'],
      }),
    )
  })

  it('forbids creating a new board from the client', async () => {
    await assertFails(
      setDoc(doc(member(), 'boards', 'other'), { allowedEmails: ['allowed@example.com'] }),
    )
  })
})
