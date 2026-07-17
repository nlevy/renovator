import { describe, expect, it } from 'vitest'
import { exportFilename, parseImport, serializeData } from './importExport'
import { SCHEMA_VERSION } from '../domain/schemas'
import { sampleData } from '../test/fixtures'

describe('export/import round trip', () => {
  it('restores identical data', () => {
    const data = sampleData()
    expect(parseImport(serializeData(data))).toEqual(data)
  })
})

describe('parseImport validation', () => {
  it('rejects a non-JSON file', () => {
    expect(() => parseImport('not json at all')).toThrow('JSON')
  })

  it('rejects JSON without schemaVersion', () => {
    expect(() => parseImport(JSON.stringify({ tasks: [] }))).toThrow('schemaVersion')
  })

  it('rejects a file from a newer app version', () => {
    const data = { ...sampleData(), schemaVersion: SCHEMA_VERSION + 1 }
    expect(() => parseImport(JSON.stringify(data))).toThrow('גרסה חדשה')
  })

  it('rejects structurally invalid data with a field path', () => {
    const data = sampleData()
    data.tasks[0].payments[0].amount = -5 as never
    expect(() => parseImport(serializeData(data))).toThrow('tasks.0.payments.0.amount')
  })

  it('fills defaults for omitted optional collections', () => {
    const parsed = parseImport(JSON.stringify({ schemaVersion: SCHEMA_VERSION }))
    expect(parsed.tasks).toEqual([])
    expect(parsed.settings).toEqual({})
  })
})

describe('exportFilename', () => {
  it('embeds the date', () => {
    expect(exportFilename(new Date('2026-07-16T10:00:00'))).toBe('renovator-2026-07-16.json')
  })
})
