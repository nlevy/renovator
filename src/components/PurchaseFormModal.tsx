import { useState } from 'react'
import { moveTimingLabels, purchaseStatusLabels } from '../domain/labels'
import type { MoveTiming, Purchase, PurchaseStatus } from '../domain/schemas'
import { useStore, type NewPurchase } from '../store/useStore'
import PaymentsEditor from './PaymentsEditor'
import Button from './ui/Button'
import Modal from './ui/Modal'
import { Field, Select, Textarea, TextInput } from './ui/fields'

const statusOptions = (Object.keys(purchaseStatusLabels) as PurchaseStatus[]).map((value) => ({
  value,
  label: purchaseStatusLabels[value],
}))

const moveTimingOptions = (Object.keys(moveTimingLabels) as MoveTiming[]).map((value) => ({
  value,
  label: moveTimingLabels[value],
}))

function blankDraft(): NewPurchase {
  return {
    title: '',
    status: 'to_buy',
    quantity: 1,
    payments: [],
    moveTiming: 'either',
    notes: '',
  }
}

function toDraft(purchase: Purchase): NewPurchase {
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = purchase
  return rest
}

function numberOrUndefined(value: string): number | undefined {
  if (value.trim() === '') return undefined
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

interface Props {
  purchase?: Purchase
  onClose: () => void
}

export default function PurchaseFormModal({ purchase, onClose }: Props) {
  const { addPurchase, updatePurchase, categories, rooms, contacts } = useStore()
  const [draft, setDraft] = useState<NewPurchase>(purchase ? toDraft(purchase) : blankDraft())
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof NewPurchase>(key: K, value: NewPurchase[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'he')
  const noneOption = { value: '', label: '— ללא —' }
  const categoryOptions = [noneOption, ...[...categories].sort(byName).map((c) => ({ value: c.id, label: c.name }))]
  const roomOptions = [noneOption, ...[...rooms].sort(byName).map((r) => ({ value: r.id, label: r.name }))]
  const vendorOptions = [noneOption, ...contacts.map((c) => ({ value: c.id, label: c.name }))]

  const submit = () => {
    if (!draft.title.trim()) {
      setError('יש להזין שם לפריט')
      return
    }
    if (draft.orderDate && draft.deliveryDate && draft.deliveryDate < draft.orderDate) {
      setError('תאריך האספקה מוקדם מתאריך ההזמנה')
      return
    }
    if (purchase) {
      updatePurchase(purchase.id, draft)
    } else {
      addPurchase(draft)
    }
    onClose()
  }

  return (
    <Modal
      title={purchase ? 'עריכת רכישה' : 'רכישה חדשה'}
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

        <Field label="שם הפריט">
          <TextInput
            value={draft.title}
            autoFocus
            onChange={(e) => set('title', e.target.value)}
            placeholder="למשל: ברז למטבח"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="סטטוס">
            <Select
              options={statusOptions}
              value={draft.status}
              onChange={(e) => set('status', e.target.value as PurchaseStatus)}
            />
          </Field>
          <Field label="ספק / חנות">
            <Select
              options={vendorOptions}
              value={draft.vendorId ?? ''}
              onChange={(e) => set('vendorId', e.target.value || undefined)}
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
          <Field label="מחיר סופי (₪)" hint="השאירו ריק אם עדיין לא נקנה">
            <TextInput
              type="number"
              min="0"
              value={draft.price ?? ''}
              onChange={(e) => set('price', numberOrUndefined(e.target.value))}
            />
          </Field>
          <Field label="הערכת מחיר (₪)" hint="משמש בתקציב עד לרכישה">
            <TextInput
              type="number"
              min="0"
              value={draft.estimatedPrice ?? ''}
              onChange={(e) => set('estimatedPrice', numberOrUndefined(e.target.value))}
            />
          </Field>
          <Field label="כמות">
            <TextInput
              type="number"
              min="1"
              value={draft.quantity}
              onChange={(e) => set('quantity', Math.max(1, Number(e.target.value) || 1))}
            />
          </Field>
          <Field label="קישור למוצר">
            <TextInput
              type="url"
              value={draft.link ?? ''}
              placeholder="https://"
              onChange={(e) => set('link', e.target.value || undefined)}
            />
          </Field>
          <Field label="תאריך הזמנה">
            <TextInput
              type="date"
              value={draft.orderDate ?? ''}
              onChange={(e) => set('orderDate', e.target.value || undefined)}
            />
          </Field>
          <Field label="תאריך אספקה">
            <TextInput
              type="date"
              value={draft.deliveryDate ?? ''}
              onChange={(e) => set('deliveryDate', e.target.value || undefined)}
            />
          </Field>
        </div>

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
