import { describe, expect, it } from 'vitest'
import { defaultTaskFilters, filterAndSortTasks } from './taskFilters'
import { payment, task } from '../test/fixtures'

describe('filterAndSortTasks', () => {
  const tasks = [
    task({ title: 'צביעת סלון', status: 'done', categoryId: 'paint', price: 4000, updatedAt: '2026-07-01T00:00:00Z', startDate: '2026-08-10' }),
    task({ title: 'אינסטלציה במטבח', status: 'in_progress', categoryId: 'plumbing', roomId: 'kitchen', price: 10000, updatedAt: '2026-07-03T00:00:00Z', startDate: '2026-08-01' }),
    task({ title: 'החלפת נורות', status: 'not_started', categoryId: 'electric', notes: 'צריך לקנות נורות LED', updatedAt: '2026-07-02T00:00:00Z' }),
  ]

  it('returns all tasks with default filters', () => {
    expect(filterAndSortTasks(tasks, defaultTaskFilters)).toHaveLength(3)
  })

  it('filters by status', () => {
    const result = filterAndSortTasks(tasks, { ...defaultTaskFilters, status: 'in_progress' })
    expect(result.map((t) => t.title)).toEqual(['אינסטלציה במטבח'])
  })

  it('filters by the scheduled status', () => {
    const scheduled = task({ title: 'ריצוף מתוזמן', status: 'scheduled', startDate: '2026-09-01' })
    const result = filterAndSortTasks([...tasks, scheduled], { ...defaultTaskFilters, status: 'scheduled' })
    expect(result.map((t) => t.title)).toEqual(['ריצוף מתוזמן'])
  })

  it('filters by category and room', () => {
    const result = filterAndSortTasks(tasks, { ...defaultTaskFilters, categoryId: 'plumbing', roomId: 'kitchen' })
    expect(result).toHaveLength(1)
  })

  it('searches across title, description and notes', () => {
    expect(filterAndSortTasks(tasks, { ...defaultTaskFilters, search: 'LED' })).toHaveLength(1)
    expect(filterAndSortTasks(tasks, { ...defaultTaskFilters, search: 'מטבח' }).map((t) => t.title)).toEqual([
      'אינסטלציה במטבח',
    ])
  })

  it('sorts by price descending', () => {
    const result = filterAndSortTasks(tasks, { ...defaultTaskFilters, sort: 'price' })
    expect(result.map((t) => t.price)).toEqual([10000, 4000, undefined])
  })

  it('sorts by date with undated tasks last', () => {
    const result = filterAndSortTasks(tasks, { ...defaultTaskFilters, sort: 'date' })
    expect(result.map((t) => t.title)).toEqual(['אינסטלציה במטבח', 'צביעת סלון', 'החלפת נורות'])
  })

  it('sorts by updated time descending by default', () => {
    const result = filterAndSortTasks(tasks, defaultTaskFilters)
    expect(result.map((t) => t.title)).toEqual(['אינסטלציה במטבח', 'החלפת נורות', 'צביעת סלון'])
  })

  it('reverses direction when dir is set, keeping undated tasks last', () => {
    const result = filterAndSortTasks(tasks, { ...defaultTaskFilters, sort: 'date', dir: 'desc' })
    // present dates newest-first, the undated task still pinned last
    expect(result.map((t) => t.title)).toEqual(['צביעת סלון', 'אינסטלציה במטבח', 'החלפת נורות'])
  })

  it('flips price to ascending when requested, no-price tasks still last', () => {
    const result = filterAndSortTasks(tasks, { ...defaultTaskFilters, sort: 'price', dir: 'asc' })
    expect(result.map((t) => t.price)).toEqual([4000, 10000, undefined])
  })

  it('sorts by remaining-to-pay, most owed first, fully-paid pinned last', () => {
    const owed = [
      task({ title: 'שולם', price: 1000, payments: [payment(1000, { date: '2026-01-01' })] }),
      task({ title: 'חצי', price: 1000, payments: [payment(400, { date: '2026-01-01' })] }), // owes 600
      task({ title: 'הכל', price: 5000 }), // owes 5000
    ]
    const result = filterAndSortTasks(owed, { ...defaultTaskFilters, sort: 'remaining' }, '2026-08-10')
    expect(result.map((t) => t.title)).toEqual(['הכל', 'חצי', 'שולם'])
  })

  it('treats a future payment as still owed when sorting by remaining', () => {
    const owed = [
      task({ title: 'עתידי', price: 1000, payments: [payment(1000, { date: '2026-09-01' })] }),
      task({ title: 'שולם', price: 1000, payments: [payment(1000, { date: '2026-01-01' })] }),
    ]
    const result = filterAndSortTasks(owed, { ...defaultTaskFilters, sort: 'remaining' }, '2026-08-10')
    expect(result.map((t) => t.title)).toEqual(['עתידי', 'שולם'])
  })
})
