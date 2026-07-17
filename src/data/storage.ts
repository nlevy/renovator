// Rough localStorage quota on most browsers is ~5MB; warn as we approach it.
export const STORAGE_WARN_BYTES = 4 * 1024 * 1024

export function storageUsageBytes(storage: Storage = localStorage): number {
  let bytes = 0
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (!key || !key.startsWith('renovator')) continue
    const value = storage.getItem(key) ?? ''
    // localStorage stores UTF-16 code units → 2 bytes each
    bytes += (key.length + value.length) * 2
  }
  return bytes
}

export function isStorageNearFull(storage: Storage = localStorage): boolean {
  return storageUsageBytes(storage) >= STORAGE_WARN_BYTES
}
