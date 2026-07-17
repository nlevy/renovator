import { afterEach, describe, expect, it } from 'vitest'
import { initSync, stopSync } from './sync'
import { LocalAdapter } from './adapters/LocalAdapter'
import { createInitialData } from './seed'
import { useStore } from '../store/useStore'

function memoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
    clear: () => map.clear(),
    key: (i) => [...map.keys()][i] ?? null,
    get length() {
      return map.size
    },
  } as Storage
}

describe('sync controller (guest mode)', () => {
  afterEach(async () => {
    await stopSync()
  })

  it('seeds and persists on first run', async () => {
    const storage = memoryStorage()
    await initSync(new LocalAdapter(storage))
    expect(useStore.getState().categories.length).toBeGreaterThan(0)
    // seed was written immediately so IDs are stable across reloads
    expect(storage.getItem('renovator-data')).not.toBeNull()
  })

  it('saves store changes and restores them on reload', async () => {
    const storage = memoryStorage()

    await initSync(new LocalAdapter(storage))
    useStore.getState().addTask({
      title: 'צביעת סלון',
      description: '',
      status: 'not_started',
      payments: [],
      dependsOn: [],
      notes: '',
    })
    await stopSync() // flushes the pending debounced save

    // simulate a reload: wipe in-memory state, then re-init from the same storage
    useStore.setState(createInitialData())
    expect(useStore.getState().tasks).toHaveLength(0)

    await initSync(new LocalAdapter(storage))
    expect(useStore.getState().tasks.map((t) => t.title)).toEqual(['צביעת סלון'])
  })
})
