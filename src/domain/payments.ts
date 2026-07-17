import { addMonths, format, parseISO } from 'date-fns'
import type { Payment, PaymentMethod } from './schemas'

export type NewPayment = Omit<Payment, 'id'>

// Split a total into `count` payments, one month apart starting on `firstDate`.
// Amounts are distributed in whole agorot so they sum back to exactly `total`;
// any rounding remainder lands on the earliest payments.
export function generateInstallments(
  total: number,
  count: number,
  firstDate: string,
  method: PaymentMethod = 'credit',
): NewPayment[] {
  if (count < 1) return []
  const totalAgorot = Math.round(total * 100)
  const base = Math.floor(totalAgorot / count)
  const remainder = totalAgorot - base * count
  const start = parseISO(firstDate)

  return Array.from({ length: count }, (_, i) => ({
    amount: (base + (i < remainder ? 1 : 0)) / 100,
    date: format(addMonths(start, i), 'yyyy-MM-dd'),
    method,
    note: `תשלום ${i + 1}/${count}`,
  }))
}
