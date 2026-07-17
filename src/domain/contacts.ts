import { paidAmount } from './derive'
import type { Purchase, Task } from './schemas'

export interface ContactUsage {
  tasks: Task[]
  purchases: Purchase[]
  totalPaid: number
  linkedCount: number
}

export function contactUsage(
  contactId: string,
  tasks: Task[],
  purchases: Purchase[],
  today: string,
): ContactUsage {
  const linkedTasks = tasks.filter((t) => t.contactId === contactId)
  const linkedPurchases = purchases.filter((p) => p.vendorId === contactId)
  const totalPaid =
    linkedTasks.reduce((sum, t) => sum + paidAmount(t, today), 0) +
    linkedPurchases.reduce((sum, p) => sum + paidAmount(p, today), 0)
  return {
    tasks: linkedTasks,
    purchases: linkedPurchases,
    totalPaid,
    linkedCount: linkedTasks.length + linkedPurchases.length,
  }
}
