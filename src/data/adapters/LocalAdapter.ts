import { migrateToCurrent } from '../../domain/migrations'
import type { AppData } from '../../domain/schemas'
import type { StorageAdapter } from './StorageAdapter'

const KEY = 'renovator-data'

/**
 * Guest-mode storage backed by localStorage.
 *
 * Historically the data was written by zustand's `persist` middleware, which
 * wraps the payload as `{ state, version }`. We now store the plain `AppData`
 * under the same key and transparently unwrap the old envelope on read, so
 * existing guest data survives the upgrade.
 */
export class LocalAdapter implements StorageAdapter {
  constructor(private readonly storage: Storage = localStorage) {}

  async load(): Promise<AppData | null> {
    const raw = this.storage.getItem(KEY)
    if (!raw) return null
    try {
      const parsed: unknown = JSON.parse(raw)
      const candidate =
        parsed && typeof parsed === 'object' && 'state' in parsed
          ? (parsed as { state: unknown }).state
          : parsed
      return migrateToCurrent(candidate)
    } catch {
      // unreadable/invalid — treat as a fresh start (matches prior behavior)
      return null
    }
  }

  async save(data: AppData): Promise<void> {
    this.storage.setItem(KEY, JSON.stringify(data))
  }
}

/** Removes the guest dataset from this browser. */
export function clearLocalData(storage: Storage = localStorage): void {
  storage.removeItem(KEY)
}
