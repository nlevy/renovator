import { describe, expect, it } from 'vitest'
import { budgetTotals, effectivePrice, groupBudgetTotals, paidAmount, paymentStatus, scheduledAmount } from './derive'
import { payment, task } from '../test/fixtures'

const LATER = '2026-12-31' // after every fixture payment date, so all count as paid

describe('paidAmount', () => {
  it('sums payments dated today or earlier', () => {
    expect(paidAmount(task({ payments: [payment(1000), payment(2500)] }), LATER)).toBe(3500)
  })

  it('excludes future-dated payments', () => {
    const t = task({ payments: [payment(1000, { date: '2026-07-01' }), payment(2500, { date: '2026-09-01' })] })
    expect(paidAmount(t, '2026-08-01')).toBe(1000)
  })

  it('is zero without payments', () => {
    expect(paidAmount(task(), LATER)).toBe(0)
  })
})

describe('scheduledAmount', () => {
  it('sums only future-dated payments', () => {
    const t = task({ payments: [payment(1000, { date: '2026-07-01' }), payment(2500, { date: '2026-09-01' })] })
    expect(scheduledAmount(t, '2026-08-01')).toBe(2500)
  })
})

describe('effectivePrice', () => {
  it('prefers final price over estimate', () => {
    expect(effectivePrice(task({ price: 1000, estimatedPrice: 800 }))).toBe(1000)
  })

  it('falls back to estimate, then zero', () => {
    expect(effectivePrice(task({ estimatedPrice: 800 }))).toBe(800)
    expect(effectivePrice(task())).toBe(0)
  })
})

describe('paymentStatus', () => {
  it('is unpaid with no payments', () => {
    expect(paymentStatus(task({ price: 1000 }), LATER)).toBe('unpaid')
  })

  it('is partial when paid less than price', () => {
    expect(paymentStatus(task({ price: 1000, payments: [payment(300)] }), LATER)).toBe('partial')
  })

  it('is paid when payments cover the price', () => {
    expect(paymentStatus(task({ price: 1000, payments: [payment(600), payment(400)] }), LATER)).toBe('paid')
  })

  it('treats a fully-scheduled item as unpaid until the dates arrive', () => {
    const t = task({ price: 1000, payments: [payment(1000, { date: '2026-09-01' })] })
    expect(paymentStatus(t, '2026-08-01')).toBe('unpaid')
    expect(paymentStatus(t, '2026-09-02')).toBe('paid')
  })
})

describe('budgetTotals', () => {
  const items = [
    task({ price: 10000, payments: [payment(3000)] }),
    task({ estimatedPrice: 5000 }),
    task({ price: 2000, payments: [payment(2000)] }),
    task({ status: 'cancelled', price: 9999, payments: [payment(500)] }),
    task({ price: 1000, payments: [payment(1500)] }),
  ]

  it('computes expected, paid, committed-unpaid and estimated', () => {
    expect(budgetTotals(items, LATER)).toEqual({
      expected: 18000,
      paid: 6500,
      committedUnpaid: 7000,
      estimated: 5000,
    })
  })

  it('keeps a future payment out of paid and inside committed-unpaid', () => {
    const future = [task({ price: 10000, payments: [payment(4000, { date: '2026-09-01' })] })]
    expect(budgetTotals(future, '2026-08-01')).toEqual({
      expected: 10000,
      paid: 0,
      committedUnpaid: 10000,
      estimated: 0,
    })
  })

  it('excludes cancelled items entirely', () => {
    expect(budgetTotals([task({ status: 'cancelled', price: 9999 })], LATER)).toEqual({
      expected: 0,
      paid: 0,
      committedUnpaid: 0,
      estimated: 0,
    })
  })
})

describe('groupBudgetTotals', () => {
  it('groups totals by key, including items without a key', () => {
    const items = [
      task({ categoryId: 'a', price: 1000, payments: [payment(400)] }),
      task({ categoryId: 'a', estimatedPrice: 500 }),
      task({ categoryId: 'b', price: 2000 }),
      task({ price: 300 }),
    ]
    const groups = groupBudgetTotals(items, (t) => t.categoryId, LATER)
    expect(groups.get('a')).toEqual({ expected: 1500, paid: 400, committedUnpaid: 600, estimated: 500 })
    expect(groups.get('b')).toEqual({ expected: 2000, paid: 0, committedUnpaid: 2000, estimated: 0 })
    expect(groups.get(undefined)).toEqual({ expected: 300, paid: 0, committedUnpaid: 300, estimated: 0 })
  })
})
