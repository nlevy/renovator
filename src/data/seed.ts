import { SCHEMA_VERSION, type AppData, type Category, type Room } from '../domain/schemas'

const defaultCategories: Array<[string, string]> = [
  ['אינסטלציה', '#0ea5e9'],
  ['חשמל', '#f59e0b'],
  ['ריצוף וחיפוי', '#8b5cf6'],
  ['צבע', '#ec4899'],
  ['גבס ותקרות', '#94a3b8'],
  ['נגרות', '#b45309'],
  ['מטבח', '#10b981'],
  ['אלומיניום וחלונות', '#06b6d4'],
  ['מיזוג אוויר', '#3b82f6'],
  ['כללי', '#64748b'],
]

const defaultRooms = ['מטבח', 'סלון', 'חדר רחצה', 'חדר שינה', 'חדר ילדים', 'מרפסת', 'כללי']

export function seedCategories(): Category[] {
  return defaultCategories.map(([name, color]) => ({ id: crypto.randomUUID(), name, color }))
}

export function seedRooms(): Room[] {
  return defaultRooms.map((name) => ({ id: crypto.randomUUID(), name }))
}

export function createInitialData(): AppData {
  return {
    schemaVersion: SCHEMA_VERSION,
    tasks: [],
    purchases: [],
    contacts: [],
    categories: seedCategories(),
    rooms: seedRooms(),
    settings: {},
  }
}
