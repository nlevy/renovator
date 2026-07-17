import { createInitialData } from './seed'
import { LocalAdapter } from './adapters/LocalAdapter'
import type { StorageAdapter } from './adapters/StorageAdapter'
import { extractData, useStore } from '../store/useStore'

const SAVE_DEBOUNCE_MS = 1500

let adapter: StorageAdapter | null = null
let storeUnsub: (() => void) | null = null
let remoteUnsub: (() => void) | null = null
let saveTimer: ReturnType<typeof setTimeout> | null = null
let applyingRemote = false

function scheduleSave() {
  if (applyingRemote) return // don't echo a remote update straight back out
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    void adapter?.save(extractData(useStore.getState()))
  }, SAVE_DEBOUNCE_MS)
}

/**
 * Wires the store to a storage adapter: load initial data, then keep the store
 * and the backing store in sync (debounced saves out, realtime updates in).
 *
 * For M1 this only runs the guest LocalAdapter; account mode (CloudAdapter)
 * plugs in here later without touching the store or UI.
 */
export async function initSync(next: StorageAdapter = new LocalAdapter()): Promise<void> {
  await stopSync()
  adapter = next

  const loaded = await adapter.load()
  const initial = loaded ?? createInitialData()
  useStore.getState().hydrate(initial)
  // persist the freshly seeded data so IDs are stable across reloads
  if (!loaded) await adapter.save(initial)

  storeUnsub = useStore.subscribe(scheduleSave)

  if (adapter.subscribe) {
    remoteUnsub = adapter.subscribe((data) => {
      applyingRemote = true
      try {
        useStore.getState().hydrate(data)
      } finally {
        applyingRemote = false
      }
    })
  }
}

export async function stopSync(): Promise<void> {
  storeUnsub?.()
  remoteUnsub?.()
  storeUnsub = null
  remoteUnsub = null
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
    // flush any pending change so nothing is lost on teardown; best-effort,
    // since e.g. a cloud write right after sign-out will be rejected
    if (adapter) {
      try {
        await adapter.save(extractData(useStore.getState()))
      } catch {
        // ignore — teardown must not throw
      }
    }
  }
  adapter = null
}
