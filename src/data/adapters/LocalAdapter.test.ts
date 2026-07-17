import { describe, expect, it } from 'vitest'
import { LocalAdapter } from './LocalAdapter'
import { sampleData } from '../../test/fixtures'

function memoryStorage(seed?: string): Storage {
  const map = new Map<string, string>()
  if (seed !== undefined) map.set('renovator-data', seed)
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

describe('LocalAdapter', () => {
  it('returns null when nothing is stored', async () => {
    expect(await new LocalAdapter(memoryStorage()).load()).toBeNull()
  })

  it('loads plain AppData written by the new format', async () => {
    const data = sampleData()
    const adapter = new LocalAdapter(memoryStorage(JSON.stringify(data)))
    expect(await adapter.load()).toEqual(data)
  })

  it('unwraps the legacy zustand persist envelope', async () => {
    const data = sampleData()
    const envelope = JSON.stringify({ state: data, version: 1 })
    const adapter = new LocalAdapter(memoryStorage(envelope))
    expect(await adapter.load()).toEqual(data)
  })

  it('returns null for corrupt storage instead of throwing', async () => {
    expect(await new LocalAdapter(memoryStorage('{not json')).load()).toBeNull()
  })

  it('round-trips through save then load', async () => {
    const storage = memoryStorage()
    const adapter = new LocalAdapter(storage)
    const data = sampleData()
    await adapter.save(data)
    expect(await adapter.load()).toEqual(data)
  })
})
