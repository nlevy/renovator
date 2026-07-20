import { effectivePrice, paidAmount } from './derive'
import type { SortDir } from './taskFilters'
import type { MoveTiming, Purchase, PurchaseStatus } from './schemas'

export type PurchaseSort = 'updated' | 'date' | 'price' | 'remaining' | 'title' | 'status'

export interface PurchaseFilters {
  search: string
  // multi-select: an empty array means "no filter" (match all)
  statuses: PurchaseStatus[]
  categoryIds: string[]
  roomIds: string[]
  vendorIds: string[]
  moveTimings: MoveTiming[]
  sort: PurchaseSort
  // when omitted, the sort key's natural direction is used
  dir?: SortDir
}

export const defaultPurchaseFilters: PurchaseFilters = {
  search: '',
  statuses: [],
  categoryIds: [],
  roomIds: [],
  vendorIds: [],
  moveTimings: [],
  sort: 'updated',
}

const naturalDir: Record<PurchaseSort, SortDir> = {
  updated: 'desc',
  date: 'asc',
  price: 'desc',
  remaining: 'desc',
  title: 'asc',
  status: 'asc',
}

function remainingToPay(purchase: Purchase, today: string): number {
  return Math.max(effectivePrice(purchase) - paidAmount(purchase, today), 0)
}

export function purchaseSortDir(filters: PurchaseFilters): SortDir {
  return filters.dir ?? naturalDir[filters.sort]
}

const statusOrder: Record<PurchaseStatus, number> = {
  to_buy: 0,
  ordered: 1,
  delivered: 2,
  cancelled: 3,
}

function matches(purchase: Purchase, filters: PurchaseFilters): boolean {
  if (filters.statuses.length && !filters.statuses.includes(purchase.status)) return false
  if (
    filters.categoryIds.length &&
    !(purchase.categoryId && filters.categoryIds.includes(purchase.categoryId))
  )
    return false
  if (filters.roomIds.length && !(purchase.roomId && filters.roomIds.includes(purchase.roomId)))
    return false
  if (filters.vendorIds.length && !(purchase.vendorId && filters.vendorIds.includes(purchase.vendorId)))
    return false
  if (filters.moveTimings.length && !filters.moveTimings.includes(purchase.moveTiming)) return false
  const query = filters.search.trim().toLowerCase()
  if (query) {
    const haystack = `${purchase.title} ${purchase.notes}`.toLowerCase()
    if (!haystack.includes(query)) return false
  }
  return true
}

function isMissing(purchase: Purchase, sort: PurchaseSort, today: string): boolean {
  if (sort === 'date') return !purchase.deliveryDate && !purchase.orderDate
  if (sort === 'price') return effectivePrice(purchase) === 0
  if (sort === 'remaining') return remainingToPay(purchase, today) === 0
  return false
}

function compareAsc(a: Purchase, b: Purchase, sort: PurchaseSort, today: string): number {
  switch (sort) {
    case 'title':
      return a.title.localeCompare(b.title, 'he')
    case 'status':
      return statusOrder[a.status] - statusOrder[b.status]
    case 'price':
      return effectivePrice(a) - effectivePrice(b)
    case 'remaining':
      return remainingToPay(a, today) - remainingToPay(b, today)
    case 'date': {
      const da = a.deliveryDate ?? a.orderDate ?? ''
      const db = b.deliveryDate ?? b.orderDate ?? ''
      return da.localeCompare(db)
    }
    case 'updated':
    default:
      return a.updatedAt.localeCompare(b.updatedAt)
  }
}

export function filterAndSortPurchases(purchases: Purchase[], filters: PurchaseFilters, today = ''): Purchase[] {
  const factor = purchaseSortDir(filters) === 'desc' ? -1 : 1
  return purchases
    .filter((purchase) => matches(purchase, filters))
    .sort((a, b) => {
      const am = isMissing(a, filters.sort, today)
      const bm = isMissing(b, filters.sort, today)
      if (am !== bm) return am ? 1 : -1
      return factor * compareAsc(a, b, filters.sort, today)
    })
}

// A purchase needs attention when its delivery date has passed without being
// delivered, or when a still-to-buy item was meant to be ordered by now. A past
// order date on an already-ordered item is normal and not overdue.
export function isPurchaseOverdue(purchase: Purchase, today: string): boolean {
  if (purchase.status === 'delivered' || purchase.status === 'cancelled') return false
  if (purchase.deliveryDate && purchase.deliveryDate < today) return true
  if (purchase.status === 'to_buy' && purchase.orderDate && purchase.orderDate < today) return true
  return false
}
