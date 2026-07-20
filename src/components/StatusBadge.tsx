import { moveTimingLabels, purchaseStatusLabels, taskStatusLabels } from '../domain/labels'
import type { MoveTiming, PurchaseStatus, TaskStatus } from '../domain/schemas'

type Tone = 'slate' | 'blue' | 'violet' | 'amber' | 'red' | 'green' | 'gray'

const toneClasses: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-700',
  blue: 'bg-blue-100 text-blue-700',
  violet: 'bg-violet-100 text-violet-700',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-700',
  green: 'bg-green-100 text-green-700',
  gray: 'bg-slate-200 text-slate-500 line-through',
}

const taskTones: Record<TaskStatus, Tone> = {
  not_started: 'slate',
  scheduled: 'violet',
  in_progress: 'blue',
  stuck: 'red',
  done: 'green',
  cancelled: 'gray',
}

const purchaseTones: Record<PurchaseStatus, Tone> = {
  to_buy: 'slate',
  ordered: 'amber',
  delivered: 'green',
  cancelled: 'gray',
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge tone={taskTones[status]} label={taskStatusLabels[status]} />
}

export function PurchaseStatusBadge({ status }: { status: PurchaseStatus }) {
  return <Badge tone={purchaseTones[status]} label={purchaseStatusLabels[status]} />
}

function Badge({ tone, label }: { tone: Tone; label: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${toneClasses[tone]}`}>
      {label}
    </span>
  )
}

// only meaningful for before/after — "either" renders nothing
export function MoveTimingBadge({ timing }: { timing: MoveTiming }) {
  if (timing === 'either') return null
  return <Badge tone={timing === 'before' ? 'violet' : 'blue'} label={moveTimingLabels[timing]} />
}
