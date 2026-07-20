import { addDays, format } from 'date-fns'
import { budgetTotals, isCancelled, type BudgetTotals } from './derive'
import { isPurchaseOverdue } from './purchaseFilters'
import { purchaseStatusLabels, taskStatusLabels } from './labels'
import type { Purchase, PurchaseStatus, Task, TaskStatus } from './schemas'

export type EventType = 'start' | 'end' | 'order' | 'delivery'

export interface UpcomingEvent {
  id: string
  kind: 'task' | 'purchase'
  title: string
  date: string
  type: EventType
}

export interface AttentionItem {
  id: string
  kind: 'task' | 'purchase'
  title: string
  reason: 'overdue' | 'stuck'
}

export interface StatusCount<S extends string> {
  status: S
  label: string
  count: number
}

export interface Dashboard {
  totalTasks: number
  doneTasks: number
  taskProgressPct: number
  totalPurchases: number
  deliveredPurchases: number
  purchaseProgressPct: number
  budget: BudgetTotals
  budgetPaidPct: number
  upcoming: UpcomingEvent[]
  attention: AttentionItem[]
  taskStatusCounts: StatusCount<TaskStatus>[]
  purchaseStatusCounts: StatusCount<PurchaseStatus>[]
}

function countByStatus<S extends string>(
  items: Array<{ status: S }>,
  labels: Record<S, string>,
): StatusCount<S>[] {
  return (Object.keys(labels) as S[]).map((status) => ({
    status,
    label: labels[status],
    count: items.filter((i) => i.status === status).length,
  }))
}

const taskActive = (s: string) => s !== 'done' && s !== 'cancelled'
const purchaseActive = (s: string) => s !== 'delivered' && s !== 'cancelled'

export function buildDashboard(
  tasks: Task[],
  purchases: Purchase[],
  today: string,
  windowDays = 7,
): Dashboard {
  const activeTasks = tasks.filter((t) => !isCancelled(t))
  const doneTasks = activeTasks.filter((t) => t.status === 'done').length
  const activePurchases = purchases.filter((p) => !isCancelled(p))
  const deliveredPurchases = activePurchases.filter((p) => p.status === 'delivered').length
  const budget = budgetTotals([...tasks, ...purchases], today)

  const windowEnd = format(addDays(new Date(today), windowDays), 'yyyy-MM-dd')
  const inWindow = (date?: string) => !!date && date >= today && date <= windowEnd

  const upcoming: UpcomingEvent[] = []
  for (const task of tasks) {
    if (!taskActive(task.status)) continue
    if (inWindow(task.startDate)) upcoming.push({ id: task.id, kind: 'task', title: task.title, date: task.startDate!, type: 'start' })
    if (inWindow(task.endDate)) upcoming.push({ id: task.id, kind: 'task', title: task.title, date: task.endDate!, type: 'end' })
  }
  for (const purchase of purchases) {
    if (!purchaseActive(purchase.status)) continue
    if (inWindow(purchase.orderDate)) upcoming.push({ id: purchase.id, kind: 'purchase', title: purchase.title, date: purchase.orderDate!, type: 'order' })
    if (inWindow(purchase.deliveryDate)) upcoming.push({ id: purchase.id, kind: 'purchase', title: purchase.title, date: purchase.deliveryDate!, type: 'delivery' })
  }
  upcoming.sort((a, b) => a.date.localeCompare(b.date))

  const attention: AttentionItem[] = []
  for (const task of tasks) {
    if (!taskActive(task.status)) continue
    const deadline = task.endDate ?? task.startDate
    if (deadline && deadline < today) {
      attention.push({ id: task.id, kind: 'task', title: task.title, reason: 'overdue' })
    } else if (task.status === 'stuck') {
      attention.push({ id: task.id, kind: 'task', title: task.title, reason: 'stuck' })
    }
  }
  for (const purchase of purchases) {
    if (isPurchaseOverdue(purchase, today)) {
      attention.push({ id: purchase.id, kind: 'purchase', title: purchase.title, reason: 'overdue' })
    }
  }

  return {
    totalTasks: activeTasks.length,
    doneTasks,
    taskProgressPct: activeTasks.length ? Math.round((doneTasks / activeTasks.length) * 100) : 0,
    totalPurchases: activePurchases.length,
    deliveredPurchases,
    purchaseProgressPct: activePurchases.length
      ? Math.round((deliveredPurchases / activePurchases.length) * 100)
      : 0,
    budget,
    budgetPaidPct: budget.expected ? Math.round((budget.paid / budget.expected) * 100) : 0,
    upcoming,
    attention,
    taskStatusCounts: countByStatus(tasks, taskStatusLabels),
    purchaseStatusCounts: countByStatus(purchases, purchaseStatusLabels),
  }
}
