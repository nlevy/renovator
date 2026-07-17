import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { Purchase, Task } from './schemas'

export interface DateRange {
  start: string
  end: string
}

export interface TimelineItem {
  id: string
  kind: 'task' | 'purchase'
  title: string
  categoryId?: string
  status: string
  start: string
  end: string
  isMilestone: boolean
  overdue: boolean
  offsetPct: number
  widthPct: number
}

export interface DependencyWarning {
  taskId: string
  taskTitle: string
  depTitle: string
}

export interface Timeline {
  range: DateRange | null
  items: TimelineItem[]
  undatedTasks: Task[]
  undatedPurchases: Purchase[]
  todayPct: number | null
  warnings: DependencyWarning[]
}

const ACTIVE_TASK = (s: string) => s !== 'done' && s !== 'cancelled'
const ACTIVE_PURCHASE = (s: string) => s !== 'delivered' && s !== 'cancelled'

function taskSpan(task: Task): DateRange | null {
  if (!task.startDate && !task.endDate) return null
  const start = task.startDate ?? task.endDate!
  const end = task.endDate ?? task.startDate!
  return end < start ? { start: end, end: start } : { start, end }
}

function purchaseSpan(purchase: Purchase): DateRange | null {
  // only the delivery date places a purchase on the timeline
  if (!purchase.deliveryDate) return null
  return { start: purchase.deliveryDate, end: purchase.deliveryDate }
}

function spanDays(range: DateRange): number {
  return differenceInCalendarDays(parseISO(range.end), parseISO(range.start)) + 1
}

export function timelineRange(tasks: Task[], purchases: Purchase[]): DateRange | null {
  const spans = [
    ...tasks.map(taskSpan),
    ...purchases.map(purchaseSpan),
  ].filter((s): s is DateRange => s !== null)
  if (spans.length === 0) return null
  return {
    start: spans.reduce((min, s) => (s.start < min ? s.start : min), spans[0].start),
    end: spans.reduce((max, s) => (s.end > max ? s.end : max), spans[0].end),
  }
}

export function dependencyWarnings(tasks: Task[]): DependencyWarning[] {
  const byId = new Map(tasks.map((t) => [t.id, t]))
  const warnings: DependencyWarning[] = []
  for (const task of tasks) {
    if (!task.startDate) continue
    for (const depId of task.dependsOn) {
      const dep = byId.get(depId)
      const depSpan = dep ? taskSpan(dep) : null
      if (dep && depSpan && depSpan.end > task.startDate) {
        warnings.push({ taskId: task.id, taskTitle: task.title, depTitle: dep.title })
      }
    }
  }
  return warnings
}

export function buildTimeline(tasks: Task[], purchases: Purchase[], today: string): Timeline {
  const range = timelineRange(tasks, purchases)
  const undatedTasks = tasks.filter((t) => !taskSpan(t))
  const undatedPurchases = purchases.filter((p) => !purchaseSpan(p))
  const warnings = dependencyWarnings(tasks)

  if (!range) {
    return { range: null, items: [], undatedTasks, undatedPurchases, todayPct: null, warnings }
  }

  const totalDays = spanDays(range)
  const pct = (isoStart: string, isoEnd: string) => {
    const offset = differenceInCalendarDays(parseISO(isoStart), parseISO(range.start))
    const width = differenceInCalendarDays(parseISO(isoEnd), parseISO(isoStart)) + 1
    return { offsetPct: (offset / totalDays) * 100, widthPct: (width / totalDays) * 100 }
  }

  const items: TimelineItem[] = []
  for (const task of tasks) {
    const span = taskSpan(task)
    if (!span) continue
    items.push({
      id: task.id,
      kind: 'task',
      title: task.title,
      categoryId: task.categoryId,
      status: task.status,
      ...span,
      isMilestone: span.start === span.end,
      overdue: ACTIVE_TASK(task.status) && span.end < today,
      ...pct(span.start, span.end),
    })
  }
  for (const purchase of purchases) {
    const span = purchaseSpan(purchase)
    if (!span) continue
    items.push({
      id: purchase.id,
      kind: 'purchase',
      title: purchase.title,
      categoryId: purchase.categoryId,
      status: purchase.status,
      ...span,
      isMilestone: span.start === span.end,
      overdue: ACTIVE_PURCHASE(purchase.status) && span.end < today,
      ...pct(span.start, span.end),
    })
  }
  items.sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title, 'he'))

  const todayInRange = today >= range.start && today <= range.end
  const todayPct = todayInRange
    ? (differenceInCalendarDays(parseISO(today), parseISO(range.start)) / totalDays) * 100
    : null

  return { range, items, undatedTasks, undatedPurchases, todayPct, warnings }
}
