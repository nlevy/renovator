import { format } from 'date-fns'
import { migrateToCurrent } from '../domain/migrations'
import type { AppData } from '../domain/schemas'

export function serializeData(data: AppData): string {
  return JSON.stringify(data, null, 2)
}

export function parseImport(json: string): AppData {
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    throw new Error('הקובץ אינו קובץ JSON תקין')
  }
  return migrateToCurrent(raw)
}

export function exportFilename(date: Date = new Date()): string {
  return `renovator-${format(date, 'yyyy-MM-dd')}.json`
}

export function downloadExport(data: AppData): void {
  const blob = new Blob([serializeData(data)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = exportFilename()
  anchor.click()
  URL.revokeObjectURL(url)
}
