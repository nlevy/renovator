import { beforeEach, describe, expect, it } from 'vitest'
import { extractData, useStore } from './useStore'
import { listBackups } from '../data/backups'
import { createInitialData } from '../data/seed'
import { sampleData } from '../test/fixtures'

describe('useStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useStore.setState(createInitialData())
  })

  it('starts with seeded categories and rooms', () => {
    const state = useStore.getState()
    expect(state.categories.length).toBeGreaterThan(0)
    expect(state.rooms.length).toBeGreaterThan(0)
    expect(state.tasks).toEqual([])
  })

  it('adds and updates a task', () => {
    const task = useStore.getState().addTask({
      title: 'צביעת סלון',
      description: '',
      status: 'not_started',
      payments: [],
      dependsOn: [],
      notes: '',
    })
    useStore.getState().updateTask(task.id, { status: 'in_progress', price: 4000 })
    const updated = useStore.getState().tasks.find((t) => t.id === task.id)!
    expect(updated.status).toBe('in_progress')
    expect(updated.price).toBe(4000)
    expect(updated.updatedAt >= task.updatedAt).toBe(true)
  })

  it('adds and removes payments on a purchase', () => {
    const purchase = useStore.getState().addPurchase({
      title: 'אריחים',
      status: 'ordered',
      quantity: 1,
      payments: [],
      notes: '',
      price: 6000,
    })
    useStore.getState().addPayment('purchase', purchase.id, {
      amount: 2000,
      date: '2026-07-16',
      method: 'credit',
      note: 'מקדמה',
    })
    let stored = useStore.getState().purchases[0]
    expect(stored.payments).toHaveLength(1)
    expect(stored.payments[0].amount).toBe(2000)

    useStore.getState().removePayment('purchase', purchase.id, stored.payments[0].id)
    stored = useStore.getState().purchases[0]
    expect(stored.payments).toHaveLength(0)
  })

  it('unlinks a deleted contact from tasks and purchases', () => {
    const contact = useStore.getState().addContact({ name: 'יוסי', role: '', phone: '', email: '', notes: '' })
    useStore.getState().addTask({
      title: 'אינסטלציה',
      description: '',
      status: 'not_started',
      contactId: contact.id,
      payments: [],
      dependsOn: [],
      notes: '',
    })
    useStore.getState().deleteContact(contact.id)
    expect(useStore.getState().contacts).toEqual([])
    expect(useStore.getState().tasks[0].contactId).toBeUndefined()
  })

  it('removes deleted tasks from dependsOn of other tasks', () => {
    const demolition = useStore.getState().addTask({
      title: 'הריסה',
      description: '',
      status: 'done',
      payments: [],
      dependsOn: [],
      notes: '',
    })
    useStore.getState().addTask({
      title: 'צבע',
      description: '',
      status: 'not_started',
      payments: [],
      dependsOn: [demolition.id],
      notes: '',
    })
    useStore.getState().deleteTask(demolition.id)
    expect(useStore.getState().tasks).toHaveLength(1)
    expect(useStore.getState().tasks[0].dependsOn).toEqual([])
  })

  it('replaceAll swaps data and keeps a backup of the previous state', () => {
    const before = extractData(useStore.getState())
    const incoming = sampleData()
    useStore.getState().replaceAll(incoming)

    expect(extractData(useStore.getState())).toEqual(incoming)
    const backups = listBackups()
    expect(backups.length).toBeGreaterThan(0)
    expect(backups[0].data).toEqual(before)
  })
})
