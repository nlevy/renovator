import { budgetTotals, effectivePrice, isCancelled, type BudgetTotals } from './derive'
import type { Category, Purchase, Room, Task } from './schemas'

export type GroupBy = 'category' | 'room'

export interface BudgetRow {
  key: string
  name: string
  totals: BudgetTotals
}

export interface CapStatus {
  amount: number
  remaining: number
  over: boolean
}

export interface BudgetReport {
  totals: BudgetTotals
  remaining: number
  rows: BudgetRow[]
  cap?: CapStatus
}

const UNASSIGNED = '__none__'

interface Options {
  groupBy: GroupBy
  categories: Category[]
  rooms: Room[]
  today: string
  cap?: number
}

export function buildBudgetReport(tasks: Task[], purchases: Purchase[], options: Options): BudgetReport {
  const items: Array<Task | Purchase> = [...tasks, ...purchases]
  const active = items.filter((item) => !isCancelled(item))
  const nameMap = new Map(
    (options.groupBy === 'category' ? options.categories : options.rooms).map((entry) => [entry.id, entry.name]),
  )
  const fallback = options.groupBy === 'category' ? 'ללא קטגוריה' : 'ללא חדר'

  const grouped = new Map<string, Array<Task | Purchase>>()
  for (const item of active) {
    const key = (options.groupBy === 'category' ? item.categoryId : item.roomId) ?? UNASSIGNED
    const bucket = grouped.get(key) ?? []
    bucket.push(item)
    grouped.set(key, bucket)
  }

  const rows: BudgetRow[] = [...grouped.entries()]
    .map(([key, groupItems]) => ({
      key,
      name: key === UNASSIGNED ? fallback : (nameMap.get(key) ?? fallback),
      totals: budgetTotals(groupItems, options.today),
    }))
    .sort((a, b) => b.totals.expected - a.totals.expected)

  const totals = budgetTotals(active, options.today)
  const cap: CapStatus | undefined =
    options.cap !== undefined
      ? { amount: options.cap, remaining: options.cap - totals.expected, over: totals.expected > options.cap }
      : undefined

  return { totals, remaining: totals.expected - totals.paid, rows, cap }
}

export function itemsInGroup(
  tasks: Task[],
  purchases: Purchase[],
  groupBy: GroupBy,
  key: string,
): Array<Task | Purchase> {
  const keyOf = (item: Task | Purchase) => (groupBy === 'category' ? item.categoryId : item.roomId) ?? UNASSIGNED
  return [...tasks, ...purchases]
    .filter((item) => !isCancelled(item) && keyOf(item) === key)
    .sort((a, b) => effectivePrice(b) - effectivePrice(a))
}
