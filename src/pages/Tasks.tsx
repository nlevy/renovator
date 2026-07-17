import { useMemo, useState } from 'react'
import PaidProgress from '../components/PaidProgress'
import { TaskStatusBadge } from '../components/StatusBadge'
import TaskFormModal from '../components/TaskFormModal'
import Button from '../components/ui/Button'
import { Select, TextInput } from '../components/ui/fields'
import { taskStatusLabels } from '../domain/labels'
import type { Task, TaskStatus } from '../domain/schemas'
import {
  defaultTaskFilters,
  filterAndSortTasks,
  taskSortDir,
  type TaskFilters,
  type TaskSort,
} from '../domain/taskFilters'
import { useStore } from '../store/useStore'
import { formatDate, todayIso } from '../utils/format'

const sortLabels: Record<TaskSort, string> = {
  updated: 'עודכן לאחרונה',
  date: 'תאריך',
  price: 'מחיר',
  remaining: 'יתרה לתשלום',
  title: 'שם',
  status: 'סטטוס',
}

const statusFilterOptions = [
  { value: 'all', label: 'כל הסטטוסים' },
  ...(Object.keys(taskStatusLabels) as TaskStatus[]).map((s) => ({ value: s, label: taskStatusLabels[s] })),
]

const statusSelectOptions = (Object.keys(taskStatusLabels) as TaskStatus[]).map((s) => ({
  value: s,
  label: taskStatusLabels[s],
}))

const sortOptions = (Object.keys(sortLabels) as TaskSort[]).map((s) => ({ value: s, label: sortLabels[s] }))

export default function Tasks() {
  const { tasks, categories, rooms, contacts, updateTask, deleteTask } = useStore()
  const [filters, setFilters] = useState<TaskFilters>(defaultTaskFilters)
  const [editing, setEditing] = useState<Task | null>(null)
  const [creating, setCreating] = useState(false)

  const nameOf = useMemo(() => {
    const cat = new Map(categories.map((c) => [c.id, c.name]))
    const room = new Map(rooms.map((r) => [r.id, r.name]))
    const contact = new Map(contacts.map((c) => [c.id, c.name]))
    return { cat, room, contact }
  }, [categories, rooms, contacts])

  const today = todayIso()
  const visible = useMemo(() => filterAndSortTasks(tasks, filters, today), [tasks, filters, today])

  const setFilter = <K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }))

  const handleDelete = (task: Task) => {
    if (window.confirm(`למחוק את המשימה "${task.title}"?`)) deleteTask(task.id)
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">משימות ({tasks.length})</h2>
        <Button onClick={() => setCreating(true)}>+ משימה חדשה</Button>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <TextInput
          placeholder="חיפוש…"
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          className="col-span-2 lg:col-span-1"
        />
        <Select
          options={statusFilterOptions}
          value={filters.status}
          onChange={(e) => setFilter('status', e.target.value as TaskFilters['status'])}
        />
        <Select
          options={[{ value: 'all', label: 'כל הקטגוריות' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
          value={filters.categoryId}
          onChange={(e) => setFilter('categoryId', e.target.value)}
        />
        <Select
          options={[{ value: 'all', label: 'כל החדרים' }, ...rooms.map((r) => ({ value: r.id, label: r.name }))]}
          value={filters.roomId}
          onChange={(e) => setFilter('roomId', e.target.value)}
        />
      </div>

      <div className="mb-4 flex items-center gap-2">
        <span className="flex items-center gap-1 text-sm text-slate-500">↕ מיון</span>
        <div className="w-40">
          <Select
            options={sortOptions}
            value={filters.sort}
            onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value as TaskSort, dir: undefined }))}
          />
        </div>
        <button
          type="button"
          onClick={() => setFilter('dir', taskSortDir(filters) === 'asc' ? 'desc' : 'asc')}
          aria-label="כיוון מיון"
          title={taskSortDir(filters) === 'asc' ? 'סדר עולה' : 'סדר יורד'}
          className="shrink-0 rounded-md border border-slate-300 px-3 py-1.5 text-slate-600 hover:bg-slate-50"
        >
          {taskSortDir(filters) === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-center text-slate-400 shadow-sm">
          {tasks.length === 0 ? 'עדיין אין משימות. הוסיפו את הראשונה!' : 'אין משימות התואמות את הסינון.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((task) => (
            <li
              key={task.id}
              role="button"
              tabIndex={0}
              onClick={() => setEditing(task)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setEditing(task)
                }
              }}
              className="cursor-pointer rounded-lg bg-white p-3 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500 sm:flex sm:items-center sm:gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{task.title}</span>
                  <TaskStatusBadge status={task.status} />
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                  {task.categoryId && <span>{nameOf.cat.get(task.categoryId)}</span>}
                  {task.roomId && <span>{nameOf.room.get(task.roomId)}</span>}
                  {task.contactId && <span>{nameOf.contact.get(task.contactId)}</span>}
                  {task.startDate && (
                    <span>
                      {formatDate(task.startDate)}
                      {task.endDate && ` – ${formatDate(task.endDate)}`}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-2 sm:mt-0">
                <PaidProgress item={task} />
              </div>

              <div
                className="mt-2 flex items-center gap-1 sm:mt-0"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <Select
                  options={statusSelectOptions}
                  value={task.status}
                  aria-label="שינוי סטטוס"
                  onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}
                  className="w-28"
                />
                <Button variant="danger" onClick={() => handleDelete(task)}>
                  מחיקה
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {creating && <TaskFormModal onClose={() => setCreating(false)} />}
      {editing && <TaskFormModal task={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
