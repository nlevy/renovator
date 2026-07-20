import { describe, expect, it } from 'vitest'
import { buildDashboard } from './dashboard'
import { payment, purchase, task } from '../test/fixtures'

const today = '2026-08-10'

describe('buildDashboard', () => {
  const tasks = [
    task({ title: 'הריסה', status: 'done', price: 5000, payments: [payment(5000)] }),
    task({ title: 'אינסטלציה', status: 'in_progress', price: 10000, payments: [payment(3000)], endDate: '2026-08-05' }),
    task({ title: 'צבע', status: 'not_started', startDate: '2026-08-12' }),
    task({ title: 'תקוע', status: 'stuck' }),
    task({ title: 'מבוטל', status: 'cancelled', price: 9999 }),
  ]
  const purchases = [
    purchase({ title: 'ברז', status: 'delivered', deliveryDate: '2026-08-14', price: 800, payments: [payment(800)] }),
    purchase({ title: 'תנור', status: 'to_buy', orderDate: '2026-08-01' }),
    purchase({ title: 'ריצוף', status: 'ordered', deliveryDate: '2026-08-13' }),
    purchase({ title: 'מבוטל', status: 'cancelled' }),
  ]

  it('computes task progress excluding cancelled tasks', () => {
    const d = buildDashboard(tasks, purchases, today)
    expect(d.totalTasks).toBe(4)
    expect(d.doneTasks).toBe(1)
    expect(d.taskProgressPct).toBe(25)
  })

  it('computes purchase-supplied progress excluding cancelled purchases', () => {
    const d = buildDashboard(tasks, purchases, today)
    expect(d.totalPurchases).toBe(3) // delivered + to_buy + ordered, excluding cancelled
    expect(d.deliveredPurchases).toBe(1)
    expect(d.purchaseProgressPct).toBe(33)
  })

  it('counts items by status (including cancelled) for the breakdown', () => {
    const d = buildDashboard(tasks, purchases, today)
    const taskCount = (s: string) => d.taskStatusCounts.find((c) => c.status === s)?.count
    expect(taskCount('done')).toBe(1)
    expect(taskCount('in_progress')).toBe(1)
    expect(taskCount('cancelled')).toBe(1)
    expect(taskCount('scheduled')).toBe(0)
    const purchaseCount = (s: string) => d.purchaseStatusCounts.find((c) => c.status === s)?.count
    expect(purchaseCount('delivered')).toBe(1)
    expect(purchaseCount('cancelled')).toBe(1)
  })

  it('computes budget paid percentage', () => {
    const d = buildDashboard(tasks, purchases, today)
    // expected = 5000+10000+0+0 + 800+0 = 15800 ; paid = 5000+3000+800 = 8800
    expect(d.budget.expected).toBe(15800)
    expect(d.budget.paid).toBe(8800)
    expect(d.budgetPaidPct).toBe(Math.round((8800 / 15800) * 100))
  })

  it('lists upcoming events within the next 7 days, sorted by date', () => {
    const d = buildDashboard(tasks, purchases, today)
    expect(d.upcoming.map((e) => [e.title, e.type])).toEqual([
      ['צבע', 'start'],
      ['ריצוף', 'delivery'],
    ])
  })

  it('flags overdue and stuck items, ignoring done/cancelled', () => {
    const d = buildDashboard(tasks, purchases, today)
    expect(d.attention).toEqual([
      { id: expect.any(String), kind: 'task', title: 'אינסטלציה', reason: 'overdue' },
      { id: expect.any(String), kind: 'task', title: 'תקוע', reason: 'stuck' },
      { id: expect.any(String), kind: 'purchase', title: 'תנור', reason: 'overdue' },
    ])
  })

  it('handles an empty project', () => {
    const d = buildDashboard([], [], today)
    expect(d.taskProgressPct).toBe(0)
    expect(d.budgetPaidPct).toBe(0)
    expect(d.upcoming).toEqual([])
    expect(d.attention).toEqual([])
  })
})
