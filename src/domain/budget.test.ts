import { describe, expect, it } from 'vitest'
import { buildBudgetReport, itemsInGroup } from './budget'

const LATER = '2026-12-31' // after every fixture payment date
import type { Category, Room } from './schemas'
import { payment, purchase, task } from '../test/fixtures'

const categories: Category[] = [
  { id: 'plumbing', name: 'אינסטלציה', color: '#000' },
  { id: 'electric', name: 'חשמל', color: '#000' },
]
const rooms: Room[] = [{ id: 'kitchen', name: 'מטבח' }]

// hand-built scenario:
// plumbing: task price 10000 paid 3000  -> expected 10000, paid 3000, committedUnpaid 7000
// electric: task estimate 5000 (no final) -> expected 5000, estimated 5000
// plumbing: purchase price 2000 paid 2000 -> expected 2000, paid 2000
// no category: purchase estimate 800 paid 200 -> expected 800, paid 200, estimated 800
// cancelled task price 9999 -> excluded
const tasks = [
  task({ categoryId: 'plumbing', roomId: 'kitchen', price: 10000, payments: [payment(3000)] }),
  task({ categoryId: 'electric', estimatedPrice: 5000 }),
  task({ status: 'cancelled', categoryId: 'plumbing', price: 9999 }),
]
const purchases = [
  purchase({ categoryId: 'plumbing', roomId: 'kitchen', price: 2000, payments: [payment(2000)] }),
  purchase({ estimatedPrice: 800, payments: [payment(200)] }),
]

describe('buildBudgetReport', () => {
  it('computes overall totals excluding cancelled items', () => {
    const report = buildBudgetReport(tasks, purchases, { groupBy: 'category', categories, rooms, today: LATER })
    expect(report.totals).toEqual({
      expected: 17800,
      paid: 5200,
      committedUnpaid: 7000,
      estimated: 5800,
    })
    expect(report.remaining).toBe(12600)
  })

  it('groups by category, sorted by expected descending, with a fallback bucket', () => {
    const report = buildBudgetReport(tasks, purchases, { groupBy: 'category', categories, rooms, today: LATER })
    expect(report.rows.map((r) => r.name)).toEqual(['אינסטלציה', 'חשמל', 'ללא קטגוריה'])
    expect(report.rows[0].totals).toEqual({ expected: 12000, paid: 5000, committedUnpaid: 7000, estimated: 0 })
    expect(report.rows[2].totals).toEqual({ expected: 800, paid: 200, committedUnpaid: 0, estimated: 800 })
  })

  it('groups by room', () => {
    const report = buildBudgetReport(tasks, purchases, { groupBy: 'room', categories, rooms, today: LATER })
    const kitchen = report.rows.find((r) => r.name === 'מטבח')!
    expect(kitchen.totals.expected).toBe(12000)
    expect(report.rows.some((r) => r.name === 'ללא חדר')).toBe(true)
  })

  it('reports cap status when under budget', () => {
    const report = buildBudgetReport(tasks, purchases, { groupBy: 'category', categories, rooms, today: LATER, cap: 20000 })
    expect(report.cap).toEqual({ amount: 20000, remaining: 2200, over: false })
  })

  it('reports cap overrun', () => {
    const report = buildBudgetReport(tasks, purchases, { groupBy: 'category', categories, rooms, today: LATER, cap: 15000 })
    expect(report.cap).toEqual({ amount: 15000, remaining: -2800, over: true })
  })

  it('omits cap when none is set', () => {
    const report = buildBudgetReport(tasks, purchases, { groupBy: 'category', categories, rooms, today: LATER })
    expect(report.cap).toBeUndefined()
  })
})

describe('itemsInGroup', () => {
  it('returns active items in a category sorted by price', () => {
    const items = itemsInGroup(tasks, purchases, 'category', 'plumbing')
    expect(items.map((i) => i.title)).toHaveLength(2)
    expect(items[0].price).toBe(10000)
  })

  it('returns the unassigned bucket', () => {
    const items = itemsInGroup(tasks, purchases, 'category', '__none__')
    expect(items).toHaveLength(1)
    expect(items[0].estimatedPrice).toBe(800)
  })
})
