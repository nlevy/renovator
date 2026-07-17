import { doc, getDoc, onSnapshot, serverTimestamp, updateDoc, type Firestore } from 'firebase/firestore'
import type { AppData } from '../../domain/schemas'
import { parseImport, serializeData } from '../importExport'
import type { StorageAdapter } from './StorageAdapter'

export const BOARD_ID = 'main'

/**
 * Account-mode storage backed by a single Firestore document
 * (`boards/{boardId}`). The whole `AppData` is stored as a JSON string in the
 * `data` field — this sidesteps Firestore's restrictions on `undefined` values
 * and nested arrays, and reuses the same serialization as file export/import.
 *
 * A per-instance `writerNonce` is written with every save so the realtime
 * listener can ignore snapshots caused by our own writes.
 */
export class CloudAdapter implements StorageAdapter {
  private readonly ref
  private readonly nonce = crypto.randomUUID()

  constructor(db: Firestore, boardId: string = BOARD_ID) {
    this.ref = doc(db, 'boards', boardId)
  }

  async load(): Promise<AppData | null> {
    // a permission-denied here (not on the allowlist) propagates to the caller
    const snap = await getDoc(this.ref)
    if (!snap.exists()) return null
    const raw = snap.get('data')
    if (typeof raw !== 'string') return null
    try {
      return parseImport(raw)
    } catch {
      return null
    }
  }

  async save(data: AppData): Promise<void> {
    // updateDoc leaves `allowedEmails` untouched, which the security rules require
    await updateDoc(this.ref, {
      data: serializeData(data),
      updatedAt: serverTimestamp(),
      writerNonce: this.nonce,
    })
  }

  subscribe(onChange: (data: AppData) => void): () => void {
    return onSnapshot(this.ref, (snap) => {
      if (!snap.exists() || snap.metadata.hasPendingWrites) return
      if (snap.get('writerNonce') === this.nonce) return // our own write echoed back
      const raw = snap.get('data')
      if (typeof raw !== 'string') return
      try {
        onChange(parseImport(raw))
      } catch {
        // ignore malformed remote payloads
      }
    })
  }
}
