import type { AppData } from '../../domain/schemas'

/**
 * Where the app's data lives. The store loads and saves through this seam and
 * does not care whether that is localStorage (guest) or the cloud (account).
 */
export interface StorageAdapter {
  /** Returns the stored data, or null when there is nothing yet (fresh start). */
  load(): Promise<AppData | null>
  /** Persists the full dataset. */
  save(data: AppData): Promise<void>
  /**
   * Optional realtime channel: invokes `onChange` when the data changes in
   * another session. Returns an unsubscribe function. Cloud adapters only.
   */
  subscribe?(onChange: (data: AppData) => void): () => void
}
