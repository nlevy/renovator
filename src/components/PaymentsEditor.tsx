import { useState } from 'react'
import { paymentMethodLabels } from '../domain/labels'
import { generateInstallments } from '../domain/payments'
import type { Payment, PaymentMethod } from '../domain/schemas'
import { formatCurrency, todayIso } from '../utils/format'
import Button from './ui/Button'
import { Select, TextInput } from './ui/fields'

const methodOptions = (Object.keys(paymentMethodLabels) as PaymentMethod[]).map((value) => ({
  value,
  label: paymentMethodLabels[value],
}))

interface Props {
  payments: Payment[]
  onChange: (payments: Payment[]) => void
}

export default function PaymentsEditor({ payments, onChange }: Props) {
  const today = todayIso()
  const [showSplit, setShowSplit] = useState(false)
  const [splitTotal, setSplitTotal] = useState('')
  const [splitCount, setSplitCount] = useState('3')
  const [splitDate, setSplitDate] = useState(today)

  const paid = payments.filter((p) => p.date <= today).reduce((s, p) => s + p.amount, 0)
  const scheduled = payments.filter((p) => p.date > today).reduce((s, p) => s + p.amount, 0)

  const update = (id: string, patch: Partial<Payment>) =>
    onChange(payments.map((p) => (p.id === id ? { ...p, ...patch } : p)))

  const add = () =>
    onChange([
      ...payments,
      { id: crypto.randomUUID(), amount: 0, date: today, method: 'transfer', note: '' },
    ])

  const remove = (id: string) => onChange(payments.filter((p) => p.id !== id))

  const generate = () => {
    const total = Number(splitTotal)
    const count = Math.floor(Number(splitCount))
    if (!(total > 0) || !(count >= 1) || !splitDate) return
    const installments = generateInstallments(total, count, splitDate).map((p) => ({
      ...p,
      id: crypto.randomUUID(),
    }))
    onChange([...payments, ...installments])
    setShowSplit(false)
    setSplitTotal('')
    setSplitCount('3')
    setSplitDate(today)
  }

  return (
    <div className="space-y-2">
      {payments.length === 0 && <p className="text-sm text-slate-400">אין תשלומים עדיין.</p>}
      {payments.map((payment) => {
        const isFuture = payment.date > today
        return (
          <div key={payment.id} className="grid grid-cols-2 gap-2 rounded-md bg-slate-50 p-2 sm:grid-cols-[7rem_9rem_1fr_auto]">
            <TextInput
              type="number"
              min="0"
              value={payment.amount || ''}
              placeholder="סכום"
              aria-label="סכום"
              onChange={(e) => update(payment.id, { amount: Number(e.target.value) || 0 })}
            />
            <TextInput
              type="date"
              value={payment.date}
              aria-label="תאריך תשלום"
              onChange={(e) => update(payment.id, { date: e.target.value })}
            />
            <Select
              options={methodOptions}
              value={payment.method}
              aria-label="אמצעי תשלום"
              onChange={(e) => update(payment.id, { method: e.target.value as PaymentMethod })}
            />
            <div className="col-span-2 flex items-center gap-2 sm:col-span-4">
              <TextInput
                value={payment.note}
                placeholder="הערה (למשל מקדמה)"
                aria-label="הערת תשלום"
                onChange={(e) => update(payment.id, { note: e.target.value })}
              />
              {isFuture && (
                <span className="whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                  מתוכנן
                </span>
              )}
              <Button variant="danger" type="button" onClick={() => remove(payment.id)}>
                הסרה
              </Button>
            </div>
          </div>
        )
      })}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex gap-2">
          <Button variant="secondary" type="button" onClick={add}>
            + הוספת תשלום
          </Button>
          <Button variant="secondary" type="button" onClick={() => setShowSplit((v) => !v)}>
            פריסה לתשלומים
          </Button>
        </div>
        {(paid > 0 || scheduled > 0) && (
          <span className="text-sm text-slate-500">
            שולם {formatCurrency(paid)}
            {scheduled > 0 && <span className="text-amber-600"> · מתוכנן {formatCurrency(scheduled)}</span>}
          </span>
        )}
      </div>

      {showSplit && (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-sm font-medium text-slate-700">פריסת תשלומים (חודש בין תשלום לתשלום)</p>
          <div className="grid grid-cols-3 gap-2">
            <label className="text-xs text-slate-500">
              סכום כולל
              <TextInput
                type="number"
                min="0"
                value={splitTotal}
                onChange={(e) => setSplitTotal(e.target.value)}
              />
            </label>
            <label className="text-xs text-slate-500">
              מספר תשלומים
              <TextInput
                type="number"
                min="1"
                value={splitCount}
                onChange={(e) => setSplitCount(e.target.value)}
              />
            </label>
            <label className="text-xs text-slate-500">
              תאריך תשלום ראשון
              <TextInput type="date" value={splitDate} onChange={(e) => setSplitDate(e.target.value)} />
            </label>
          </div>
          <div className="mt-2 flex justify-end">
            <Button type="button" onClick={generate}>
              יצירת תשלומים
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
