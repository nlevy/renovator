import type { Payment } from './schemas'

export interface Payable {
  price?: number
  estimatedPrice?: number
  payments: Payment[]
  status: string
}

export type PaymentStatus = 'unpaid' | 'partial' | 'paid'

export interface BudgetTotals {
  expected: number
  paid: number
  committedUnpaid: number
  estimated: number
}

// A payment counts as actually paid only once its date has arrived; a
// future-dated payment (e.g. a scheduled credit-card installment) is planned
// but not yet paid.
export function paidAmount(item: Payable, today: string): number {
  return item.payments.filter((p) => p.date <= today).reduce((sum, p) => sum + p.amount, 0)
}

export function scheduledAmount(item: Payable, today: string): number {
  return item.payments.filter((p) => p.date > today).reduce((sum, p) => sum + p.amount, 0)
}

export function effectivePrice(item: Payable): number {
  return item.price ?? item.estimatedPrice ?? 0
}

export function isCancelled(item: Payable): boolean {
  return item.status === 'cancelled'
}

export function paymentStatus(item: Payable, today: string): PaymentStatus {
  const paid = paidAmount(item, today)
  if (paid <= 0) return 'unpaid'
  const basis = effectivePrice(item)
  return paid >= basis ? 'paid' : 'partial'
}

export function budgetTotals(items: Payable[], today: string): BudgetTotals {
  const active = items.filter((i) => !isCancelled(i))
  const totals: BudgetTotals = { expected: 0, paid: 0, committedUnpaid: 0, estimated: 0 }
  for (const item of active) {
    const paid = paidAmount(item, today)
    totals.expected += effectivePrice(item)
    totals.paid += paid
    if (item.price !== undefined) {
      totals.committedUnpaid += Math.max(item.price - paid, 0)
    } else if (item.estimatedPrice !== undefined) {
      totals.estimated += item.estimatedPrice
    }
  }
  return totals
}

export function groupBudgetTotals<T extends Payable>(
  items: T[],
  keyOf: (item: T) => string | undefined,
  today: string,
): Map<string | undefined, BudgetTotals> {
  const groups = new Map<string | undefined, T[]>()
  for (const item of items) {
    const key = keyOf(item)
    const group = groups.get(key) ?? []
    group.push(item)
    groups.set(key, group)
  }
  return new Map([...groups.entries()].map(([key, group]) => [key, budgetTotals(group, today)]))
}
