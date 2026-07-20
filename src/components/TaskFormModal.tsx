import { useState } from 'react'
import { moveTimingLabels, taskStatusLabels } from '../domain/labels'
import type { MoveTiming, Task, TaskStatus } from '../domain/schemas'
import { useStore, type NewTask } from '../store/useStore'
import PaymentsEditor from './PaymentsEditor'
import Button from './ui/Button'
import Modal from './ui/Modal'
import { Field, Select, Textarea, TextInput } from './ui/fields'

const statusOptions = (Object.keys(taskStatusLabels) as TaskStatus[]).map((value) => ({
  value,
  label: taskStatusLabels[value],
}))

const moveTimingOptions = (Object.keys(moveTimingLabels) as MoveTiming[]).map((value) => ({
  value,
  label: moveTimingLabels[value],
}))

function blankDraft(): NewTask {
  return {
    title: '',
    description: '',
    status: 'not_started',
    payments: [],
    moveTiming: 'either',
    dependsOn: [],
    notes: '',
  }
}

function toDraft(task: Task): NewTask {
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = task
  return rest
}

function numberOrUndefined(value: string): number | undefined {
  if (value.trim() === '') return undefined
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

interface Props {
  task?: Task
  onClose: () => void
}

export default function TaskFormModal({ task, onClose }: Props) {
  const { addTask, updateTask, categories, rooms, contacts, tasks } = useStore()
  const [draft, setDraft] = useState<NewTask>(task ? toDraft(task) : blankDraft())
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof NewTask>(key: K, value: NewTask[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'he')
  const noneOption = { value: '', label: '— ללא —' }
  const categoryOptions = [noneOption, ...[...categories].sort(byName).map((c) => ({ value: c.id, label: c.name }))]
  const roomOptions = [noneOption, ...[...rooms].sort(byName).map((r) => ({ value: r.id, label: r.name }))]
  const contactOptions = [noneOption, ...contacts.map((c) => ({ value: c.id, label: c.name }))]
  const dependencyChoices = tasks.filter((t) => t.id !== task?.id)

  const submit = () => {
    if (!draft.title.trim()) {
      setError('יש להזין כותרת למשימה')
      return
    }
    if (draft.startDate && draft.endDate && draft.endDate < draft.startDate) {
      setError('תאריך הסיום מוקדם מתאריך ההתחלה')
      return
    }
    if (task) {
      updateTask(task.id, draft)
    } else {
      addTask(draft)
    }
    onClose()
  }

  return (
    <Modal
      title={task ? 'עריכת משימה' : 'משימה חדשה'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            ביטול
          </Button>
          <Button onClick={submit}>שמירה</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>}

        <Field label="כותרת">
          <TextInput
            value={draft.title}
            autoFocus
            onChange={(e) => set('title', e.target.value)}
            placeholder="למשל: החלפת צנרת במטבח"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="סטטוס">
            <Select
              options={statusOptions}
              value={draft.status}
              onChange={(e) => set('status', e.target.value as TaskStatus)}
            />
          </Field>
          <Field label="איש קשר">
            <Select
              options={contactOptions}
              value={draft.contactId ?? ''}
              onChange={(e) => set('contactId', e.target.value || undefined)}
            />
          </Field>
          <Field label="קטגוריה">
            <Select
              options={categoryOptions}
              value={draft.categoryId ?? ''}
              onChange={(e) => set('categoryId', e.target.value || undefined)}
            />
          </Field>
          <Field label="חדר">
            <Select
              options={roomOptions}
              value={draft.roomId ?? ''}
              onChange={(e) => set('roomId', e.target.value || undefined)}
            />
          </Field>
          <Field label="ביחס למעבר">
            <Select
              options={moveTimingOptions}
              value={draft.moveTiming}
              onChange={(e) => set('moveTiming', e.target.value as MoveTiming)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="מחיר סופי (₪)" hint="השאירו ריק אם עדיין אין הצעת מחיר">
            <TextInput
              type="number"
              min="0"
              value={draft.price ?? ''}
              onChange={(e) => set('price', numberOrUndefined(e.target.value))}
            />
          </Field>
          <Field label="הערכת מחיר (₪)" hint="משמש בתקציב עד שיש מחיר סופי">
            <TextInput
              type="number"
              min="0"
              value={draft.estimatedPrice ?? ''}
              onChange={(e) => set('estimatedPrice', numberOrUndefined(e.target.value))}
            />
          </Field>
          <Field label="תאריך התחלה">
            <TextInput
              type="date"
              value={draft.startDate ?? ''}
              onChange={(e) => set('startDate', e.target.value || undefined)}
            />
          </Field>
          <Field label="תאריך סיום">
            <TextInput
              type="date"
              value={draft.endDate ?? ''}
              onChange={(e) => set('endDate', e.target.value || undefined)}
            />
          </Field>
        </div>

        <Field label="תיאור">
          <Textarea rows={2} value={draft.description} onChange={(e) => set('description', e.target.value)} />
        </Field>

        {dependencyChoices.length > 0 && (
          <Field label="תלוי במשימות" hint="המשימה אמורה להתבצע אחרי המשימות המסומנות">
            <div className="max-h-28 space-y-1 overflow-y-auto rounded-md border border-slate-200 p-2">
              {dependencyChoices.map((t) => (
                <label key={t.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.dependsOn.includes(t.id)}
                    onChange={(e) =>
                      set(
                        'dependsOn',
                        e.target.checked
                          ? [...draft.dependsOn, t.id]
                          : draft.dependsOn.filter((id) => id !== t.id),
                      )
                    }
                  />
                  {t.title}
                </label>
              ))}
            </div>
          </Field>
        )}

        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700">תשלומים</span>
          <PaymentsEditor payments={draft.payments} onChange={(payments) => set('payments', payments)} />
        </div>

        <Field label="הערות">
          <Textarea rows={2} value={draft.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}
