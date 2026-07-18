import { describe, expect, it } from 'vitest'
import { defaultPurchaseFilters, filterAndSortPurchases, isPurchaseOverdue } from './purchaseFilters'
import { purchase } from '../test/fixtures'

describe('filterAndSortPurchases', () => {
  const purchases = [
    purchase({ title: 'אריחים', status: 'delivered', categoryId: 'tiles', price: 6000, updatedAt: '2026-07-01T00:00:00Z', deliveryDate: '2026-08-20' }),
    purchase({ title: 'ברז למטבח', status: 'ordered', categoryId: 'plumbing', roomId: 'kitchen', vendorId: 'v1', estimatedPrice: 800, updatedAt: '2026-07-03T00:00:00Z', deliveryDate: '2026-08-05' }),
    purchase({ title: 'תנור', status: 'to_buy', notes: 'לבדוק מבצעים', updatedAt: '2026-07-02T00:00:00Z' }),
  ]

  it('filters by status', () => {
    expect(filterAndSortPurchases(purchases, { ...defaultPurchaseFilters, statuses: ['ordered'] }).map((p) => p.title)).toEqual(['ברז למטבח'])
  })

  it('filters by multiple statuses (OR)', () => {
    const result = filterAndSortPurchases(purchases, { ...defaultPurchaseFilters, statuses: ['ordered', 'to_buy'] })
    expect(result.map((p) => p.title).sort()).toEqual(['ברז למטבח', 'תנור'].sort())
  })

  it('filters by vendor', () => {
    expect(filterAndSortPurchases(purchases, { ...defaultPurchaseFilters, vendorIds: ['v1'] })).toHaveLength(1)
  })

  it('searches title and notes', () => {
    expect(filterAndSortPurchases(purchases, { ...defaultPurchaseFilters, search: 'מבצעים' }).map((p) => p.title)).toEqual(['תנור'])
  })

  it('sorts by price descending', () => {
    expect(filterAndSortPurchases(purchases, { ...defaultPurchaseFilters, sort: 'price' }).map((p) => p.price)).toEqual([6000, undefined, undefined])
  })

  it('sorts by date with undated purchases last', () => {
    expect(filterAndSortPurchases(purchases, { ...defaultPurchaseFilters, sort: 'date' }).map((p) => p.title)).toEqual(['ברז למטבח', 'אריחים', 'תנור'])
  })
})

describe('isPurchaseOverdue', () => {
  const today = '2026-08-10'

  it('is not overdue when an ordered item only has a past order date', () => {
    expect(isPurchaseOverdue(purchase({ status: 'ordered', orderDate: '2026-08-01' }), today)).toBe(false)
  })

  it('is overdue when an ordered item has a past delivery date', () => {
    expect(isPurchaseOverdue(purchase({ status: 'ordered', deliveryDate: '2026-08-05' }), today)).toBe(true)
  })

  it('is not overdue when the delivery date is still in the future', () => {
    expect(isPurchaseOverdue(purchase({ status: 'ordered', deliveryDate: '2026-08-20' }), today)).toBe(false)
  })

  it('is overdue when a to-buy item has a past order date', () => {
    expect(isPurchaseOverdue(purchase({ status: 'to_buy', orderDate: '2026-08-01' }), today)).toBe(true)
  })

  it('is never overdue when delivered or cancelled', () => {
    expect(isPurchaseOverdue(purchase({ status: 'delivered', deliveryDate: '2026-08-01' }), today)).toBe(false)
    expect(isPurchaseOverdue(purchase({ status: 'cancelled', deliveryDate: '2026-08-01' }), today)).toBe(false)
  })
})
