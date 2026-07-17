import type { AppData } from '../domain/schemas'

const BACKUPS_KEY = 'renovator-backups'
const MAX_BACKUPS = 10

export interface Backup {
  savedAt: string
  data: AppData
}

export function clearBackups(storage: Storage = localStorage): void {
  storage.removeItem(BACKUPS_KEY)
}

export function listBackups(storage: Storage = localStorage): Backup[] {
  const raw = storage.getItem(BACKUPS_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function pushBackup(data: AppData, storage: Storage = localStorage): void {
  const backups = listBackups(storage)
  backups.unshift({ savedAt: new Date().toISOString(), data })
  try {
    storage.setItem(BACKUPS_KEY, JSON.stringify(backups.slice(0, MAX_BACKUPS)))
  } catch {
    // storage full - drop older backups until it fits
    for (let keep = MAX_BACKUPS - 1; keep >= 1; keep--) {
      try {
        storage.setItem(BACKUPS_KEY, JSON.stringify(backups.slice(0, keep)))
        return
      } catch {
        continue
      }
    }
  }
}
