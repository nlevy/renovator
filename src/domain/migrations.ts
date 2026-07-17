import { AppDataSchema, SCHEMA_VERSION, type AppData } from './schemas'

type Migration = (data: Record<string, unknown>) => Record<string, unknown>

// keyed by source version; migrations[n] upgrades version n to n+1
const migrations: Record<number, Migration> = {}

export function migrateToCurrent(raw: unknown): AppData {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('הקובץ אינו קובץ נתונים תקין')
  }
  let data = raw as Record<string, unknown>
  const version = data.schemaVersion
  if (typeof version !== 'number') {
    throw new Error('לקובץ חסר שדה schemaVersion')
  }
  if (version > SCHEMA_VERSION) {
    throw new Error(`הקובץ נוצר בגרסה חדשה יותר של האפליקציה (${version})`)
  }
  for (let v = version; v < SCHEMA_VERSION; v++) {
    const migration = migrations[v]
    if (!migration) throw new Error(`לא ניתן לשדרג מגרסה ${v}`)
    data = { ...migration(data), schemaVersion: v + 1 }
  }
  const result = AppDataSchema.safeParse(data)
  if (!result.success) {
    const issue = result.error.issues[0]
    throw new Error(`הקובץ אינו תקין: ${issue.path.join('.')} - ${issue.message}`)
  }
  return result.data
}
