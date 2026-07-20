import { effectivePrice, paidAmount } from './derive'
import type { MoveTiming, Task, TaskStatus } from './schemas'

export type TaskSort = 'updated' | 'date' | 'price' | 'remaining' | 'title' | 'status'
export type SortDir = 'asc' | 'desc'

export interface TaskFilters {
  search: string
  // multi-select: an empty array means "no filter" (match all)
  statuses: TaskStatus[]
  categoryIds: string[]
  roomIds: string[]
  contactIds: string[]
  moveTimings: MoveTiming[]
  sort: TaskSort
  // when omitted, the sort key's natural direction is used
  dir?: SortDir
}

export const defaultTaskFilters: TaskFilters = {
  search: '',
  statuses: [],
  categoryIds: [],
  roomIds: [],
  contactIds: [],
  moveTimings: [],
  sort: 'updated',
}

const naturalDir: Record<TaskSort, SortDir> = {
  updated: 'desc',
  date: 'asc',
  price: 'desc',
  remaining: 'desc',
  title: 'asc',
  status: 'asc',
}

function remainingToPay(task: Task, today: string): number {
  return Math.max(effectivePrice(task) - paidAmount(task, today), 0)
}

export function taskSortDir(filters: TaskFilters): SortDir {
  return filters.dir ?? naturalDir[filters.sort]
}

const statusOrder: Record<TaskStatus, number> = {
  in_progress: 0,
  stuck: 1,
  scheduled: 2,
  not_started: 3,
  done: 4,
  cancelled: 5,
}

function matches(task: Task, filters: TaskFilters): boolean {
  if (filters.statuses.length && !filters.statuses.includes(task.status)) return false
  if (filters.categoryIds.length && !(task.categoryId && filters.categoryIds.includes(task.categoryId)))
    return false
  if (filters.roomIds.length && !(task.roomId && filters.roomIds.includes(task.roomId))) return false
  if (filters.contactIds.length && !(task.contactId && filters.contactIds.includes(task.contactId)))
    return false
  if (filters.moveTimings.length && !filters.moveTimings.includes(task.moveTiming)) return false
  const query = filters.search.trim().toLowerCase()
  if (query) {
    const haystack = `${task.title} ${task.description} ${task.notes}`.toLowerCase()
    if (!haystack.includes(query)) return false
  }
  return true
}

// tasks with no value for the active sort key are always pinned last,
// regardless of direction
function isMissing(task: Task, sort: TaskSort, today: string): boolean {
  if (sort === 'date') return !task.startDate && !task.endDate
  if (sort === 'price') return effectivePrice(task) === 0
  if (sort === 'remaining') return remainingToPay(task, today) === 0
  return false
}

// canonical ascending comparison for the sort key
function compareAsc(a: Task, b: Task, sort: TaskSort, today: string): number {
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
      const da = a.startDate ?? a.endDate ?? ''
      const db = b.startDate ?? b.endDate ?? ''
      return da.localeCompare(db)
    }
    case 'updated':
    default:
      return a.updatedAt.localeCompare(b.updatedAt)
  }
}

export function filterAndSortTasks(tasks: Task[], filters: TaskFilters, today = ''): Task[] {
  const factor = taskSortDir(filters) === 'desc' ? -1 : 1
  return tasks
    .filter((task) => matches(task, filters))
    .sort((a, b) => {
      const am = isMissing(a, filters.sort, today)
      const bm = isMissing(b, filters.sort, today)
      if (am !== bm) return am ? 1 : -1
      return factor * compareAsc(a, b, filters.sort, today)
    })
}
