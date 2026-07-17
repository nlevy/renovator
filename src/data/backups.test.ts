import { beforeEach, describe, expect, it } from 'vitest'
import { listBackups, pushBackup } from './backups'
import { sampleData } from '../test/fixtures'

describe('backups', () => {
  beforeEach(() => localStorage.clear())

  it('stores newest first', () => {
    const first = sampleData()
    const second = { ...sampleData(), tasks: [] }
    pushBackup(first)
    pushBackup(second)
    const backups = listBackups()
    expect(backups).toHaveLength(2)
    expect(backups[0].data).toEqual(second)
    expect(backups[1].data).toEqual(first)
  })

  it('keeps at most 10 backups', () => {
    for (let i = 0; i < 13; i++) pushBackup(sampleData())
    expect(listBackups()).toHaveLength(10)
  })

  it('returns empty list for corrupt storage', () => {
    localStorage.setItem('renovator-backups', '{broken')
    expect(listBackups()).toEqual([])
  })
})
