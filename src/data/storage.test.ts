import { beforeEach, describe, expect, it } from 'vitest'
import { isStorageNearFull, STORAGE_WARN_BYTES, storageUsageBytes } from './storage'

describe('storageUsageBytes', () => {
  beforeEach(() => localStorage.clear())

  it('counts only renovator keys, at 2 bytes per code unit', () => {
    localStorage.setItem('renovator-data', 'abcde') // (14 + 5) * 2 = 38
    localStorage.setItem('unrelated', 'xxxxxxxx')
    expect(storageUsageBytes()).toBe((('renovator-data'.length + 5) * 2))
  })

  it('flags when usage crosses the warning threshold', () => {
    expect(isStorageNearFull()).toBe(false)
    localStorage.setItem('renovator-big', 'x'.repeat(STORAGE_WARN_BYTES / 2 + 1))
    expect(isStorageNearFull()).toBe(true)
  })
})
