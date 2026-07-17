import { create } from 'zustand'
import { pushBackup } from '../data/backups'
import { createInitialData } from '../data/seed'
import {
  type AppData,
  type Contact,
  type Payment,
  type Purchase,
  type Task,
} from '../domain/schemas'

export type NewTask = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
export type NewPurchase = Omit<Purchase, 'id' | 'createdAt' | 'updatedAt'>
export type NewContact = Omit<Contact, 'id'>
export type PayableKind = 'task' | 'purchase'

interface Actions {
  addTask: (input: NewTask) => Task
  updateTask: (id: string, patch: Partial<NewTask>) => void
  deleteTask: (id: string) => void
  addPurchase: (input: NewPurchase) => Purchase
  updatePurchase: (id: string, patch: Partial<NewPurchase>) => void
  deletePurchase: (id: string) => void
  addContact: (input: NewContact) => Contact
  updateContact: (id: string, patch: Partial<NewContact>) => void
  deleteContact: (id: string) => void
  addCategory: (name: string, color?: string) => void
  renameCategory: (id: string, name: string) => void
  deleteCategory: (id: string) => void
  addRoom: (name: string) => void
  renameRoom: (id: string, name: string) => void
  deleteRoom: (id: string) => void
  addPayment: (kind: PayableKind, itemId: string, payment: Omit<Payment, 'id'>) => void
  removePayment: (kind: PayableKind, itemId: string, paymentId: string) => void
  setBudgetCap: (cap: number | undefined) => void
  markExported: () => void
  replaceAll: (data: AppData) => void
  // set the full dataset without taking a backup — used on initial load and
  // when adopting a remote update (see src/data/sync.ts)
  hydrate: (data: AppData) => void
}

export type RenovatorStore = AppData & Actions

const now = () => new Date().toISOString()

function replaceById<T extends { id: string }>(list: T[], id: string, update: (item: T) => T): T[] {
  return list.map((item) => (item.id === id ? update(item) : item))
}

export function extractData(state: AppData): AppData {
  const { schemaVersion, tasks, purchases, contacts, categories, rooms, settings } = state
  return { schemaVersion, tasks, purchases, contacts, categories, rooms, settings }
}

export const useStore = create<RenovatorStore>()((set, get) => ({
  ...createInitialData(),

  addTask: (input) => {
    const task: Task = { ...input, id: crypto.randomUUID(), createdAt: now(), updatedAt: now() }
    set((s) => ({ tasks: [...s.tasks, task] }))
    return task
  },
  updateTask: (id, patch) =>
    set((s) => ({ tasks: replaceById(s.tasks, id, (t) => ({ ...t, ...patch, updatedAt: now() })) })),
  deleteTask: (id) =>
    set((s) => ({
      tasks: s.tasks
        .filter((t) => t.id !== id)
        .map((t) =>
          t.dependsOn.includes(id) ? { ...t, dependsOn: t.dependsOn.filter((d) => d !== id) } : t,
        ),
    })),

  addPurchase: (input) => {
    const purchase: Purchase = { ...input, id: crypto.randomUUID(), createdAt: now(), updatedAt: now() }
    set((s) => ({ purchases: [...s.purchases, purchase] }))
    return purchase
  },
  updatePurchase: (id, patch) =>
    set((s) => ({
      purchases: replaceById(s.purchases, id, (p) => ({ ...p, ...patch, updatedAt: now() })),
    })),
  deletePurchase: (id) => set((s) => ({ purchases: s.purchases.filter((p) => p.id !== id) })),

  addContact: (input) => {
    const contact: Contact = { ...input, id: crypto.randomUUID() }
    set((s) => ({ contacts: [...s.contacts, contact] }))
    return contact
  },
  updateContact: (id, patch) =>
    set((s) => ({ contacts: replaceById(s.contacts, id, (c) => ({ ...c, ...patch })) })),
  deleteContact: (id) =>
    set((s) => ({
      contacts: s.contacts.filter((c) => c.id !== id),
      tasks: s.tasks.map((t) => (t.contactId === id ? { ...t, contactId: undefined } : t)),
      purchases: s.purchases.map((p) => (p.vendorId === id ? { ...p, vendorId: undefined } : p)),
    })),

  addCategory: (name, color = '#64748b') =>
    set((s) => ({ categories: [...s.categories, { id: crypto.randomUUID(), name, color }] })),
  renameCategory: (id, name) =>
    set((s) => ({ categories: replaceById(s.categories, id, (c) => ({ ...c, name })) })),
  deleteCategory: (id) =>
    set((s) => ({
      categories: s.categories.filter((c) => c.id !== id),
      tasks: s.tasks.map((t) => (t.categoryId === id ? { ...t, categoryId: undefined } : t)),
      purchases: s.purchases.map((p) => (p.categoryId === id ? { ...p, categoryId: undefined } : p)),
    })),

  addRoom: (name) => set((s) => ({ rooms: [...s.rooms, { id: crypto.randomUUID(), name }] })),
  renameRoom: (id, name) =>
    set((s) => ({ rooms: replaceById(s.rooms, id, (r) => ({ ...r, name })) })),
  deleteRoom: (id) =>
    set((s) => ({
      rooms: s.rooms.filter((r) => r.id !== id),
      tasks: s.tasks.map((t) => (t.roomId === id ? { ...t, roomId: undefined } : t)),
      purchases: s.purchases.map((p) => (p.roomId === id ? { ...p, roomId: undefined } : p)),
    })),

  addPayment: (kind, itemId, payment) => {
    const withId: Payment = { ...payment, id: crypto.randomUUID() }
    const addTo = <T extends Task | Purchase>(item: T): T => ({
      ...item,
      payments: [...item.payments, withId],
      updatedAt: now(),
    })
    if (kind === 'task') {
      set((s) => ({ tasks: replaceById(s.tasks, itemId, addTo) }))
    } else {
      set((s) => ({ purchases: replaceById(s.purchases, itemId, addTo) }))
    }
  },
  removePayment: (kind, itemId, paymentId) => {
    const removeFrom = <T extends Task | Purchase>(item: T): T => ({
      ...item,
      payments: item.payments.filter((p) => p.id !== paymentId),
      updatedAt: now(),
    })
    if (kind === 'task') {
      set((s) => ({ tasks: replaceById(s.tasks, itemId, removeFrom) }))
    } else {
      set((s) => ({ purchases: replaceById(s.purchases, itemId, removeFrom) }))
    }
  },

  setBudgetCap: (cap) => set((s) => ({ settings: { ...s.settings, budgetCap: cap } })),
  markExported: () => set((s) => ({ settings: { ...s.settings, lastExportAt: now() } })),

  replaceAll: (data) => {
    pushBackup(extractData(get()))
    set(data)
  },

  hydrate: (data) => set(data),
}))

const BACKUP_INTERVAL_MS = 5 * 60 * 1000
let lastBackupAt = 0

// snapshot the pre-change state at most once per interval, so a recent state
// can be restored after a mistake
useStore.subscribe((_state, prevState) => {
  const nowMs = Date.now()
  if (nowMs - lastBackupAt < BACKUP_INTERVAL_MS) return
  lastBackupAt = nowMs
  pushBackup(extractData(prevState))
})
