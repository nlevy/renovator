import { useMemo, useState } from 'react'
import PaidProgress from '../components/PaidProgress'
import { PurchaseStatusBadge } from '../components/StatusBadge'
import PurchaseFormModal from '../components/PurchaseFormModal'
import Button from '../components/ui/Button'
import MultiSelect from '../components/ui/MultiSelect'
import { Select, TextInput } from '../components/ui/fields'
import { purchaseStatusLabels } from '../domain/labels'
import type { Purchase, PurchaseStatus } from '../domain/schemas'
import {
  defaultPurchaseFilters,
  filterAndSortPurchases,
  isPurchaseOverdue,
  purchaseSortDir,
  type PurchaseFilters,
  type PurchaseSort,
} from '../domain/purchaseFilters'
import { useStore } from '../store/useStore'
import { formatDate } from '../utils/format'

const sortLabels: Record<PurchaseSort, string> = {
  updated: 'עודכן לאחרונה',
  date: 'תאריך',
  price: 'מחיר',
  remaining: 'יתרה לתשלום',
  title: 'שם',
  status: 'סטטוס',
}

const statusSelectOptions = (Object.keys(purchaseStatusLabels) as PurchaseStatus[]).map((s) => ({
  value: s,
  label: purchaseStatusLabels[s],
}))

const sortOptions = (Object.keys(sortLabels) as PurchaseSort[]).map((s) => ({ value: s, label: sortLabels[s] }))

const todayIso = () => new Date().toISOString().slice(0, 10)

export default function Purchases() {
  const { purchases, categories, rooms, contacts, updatePurchase, deletePurchase } = useStore()
  const [filters, setFilters] = useState<PurchaseFilters>(defaultPurchaseFilters)
  const [editing, setEditing] = useState<Purchase | null>(null)
  const [creating, setCreating] = useState(false)

  const nameOf = useMemo(() => {
    const cat = new Map(categories.map((c) => [c.id, c.name]))
    const room = new Map(rooms.map((r) => [r.id, r.name]))
    const vendor = new Map(contacts.map((c) => [c.id, c.name]))
    return { cat, room, vendor }
  }, [categories, rooms, contacts])

  const today = todayIso()
  const visible = useMemo(() => filterAndSortPurchases(purchases, filters, today), [purchases, filters, today])

  const setFilter = <K extends keyof PurchaseFilters>(key: K, value: PurchaseFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }))

  const handleDelete = (purchase: Purchase) => {
    if (window.confirm(`למחוק את הפריט "${purchase.title}"?`)) deletePurchase(purchase.id)
  }

  const isOverdue = (purchase: Purchase) => isPurchaseOverdue(purchase, today)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">רכישות ({purchases.length})</h2>
        <Button onClick={() => setCreating(true)}>+ רכישה חדשה</Button>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <TextInput
          placeholder="חיפוש…"
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          className="col-span-2 lg:col-span-1"
        />
        <MultiSelect
          allLabel="כל הסטטוסים"
          options={statusSelectOptions}
          selected={filters.statuses}
          onChange={(v) => setFilter('statuses', v as PurchaseStatus[])}
        />
        <MultiSelect
          allLabel="כל הקטגוריות"
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
          selected={filters.categoryIds}
          onChange={(v) => setFilter('categoryIds', v)}
        />
        <MultiSelect
          allLabel="כל החדרים"
          options={rooms.map((r) => ({ value: r.id, label: r.name }))}
          selected={filters.roomIds}
          onChange={(v) => setFilter('roomIds', v)}
        />
      </div>

      <div className="mb-4 flex items-center gap-2">
        <span className="flex items-center gap-1 text-sm text-slate-500">↕ מיון</span>
        <div className="w-40">
          <Select
            options={sortOptions}
            value={filters.sort}
            onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value as PurchaseSort, dir: undefined }))}
          />
        </div>
        <button
          type="button"
          onClick={() => setFilter('dir', purchaseSortDir(filters) === 'asc' ? 'desc' : 'asc')}
          aria-label="כיוון מיון"
          title={purchaseSortDir(filters) === 'asc' ? 'סדר עולה' : 'סדר יורד'}
          className="shrink-0 rounded-md border border-slate-300 px-3 py-1.5 text-slate-600 hover:bg-slate-50"
        >
          {purchaseSortDir(filters) === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-center text-slate-400 shadow-sm">
          {purchases.length === 0 ? 'עדיין אין רכישות. הוסיפו את הראשונה!' : 'אין רכישות התואמות את הסינון.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((purchase) => (
            <li
              key={purchase.id}
              role="button"
              tabIndex={0}
              onClick={() => setEditing(purchase)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setEditing(purchase)
                }
              }}
              className={`cursor-pointer rounded-lg bg-white p-3 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500 sm:flex sm:items-center sm:gap-4 ${
                isOverdue(purchase) ? 'ring-1 ring-amber-300' : ''
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{purchase.title}</span>
                  {purchase.quantity > 1 && <span className="text-xs text-slate-400">×{purchase.quantity}</span>}
                  <PurchaseStatusBadge status={purchase.status} />
                  {isOverdue(purchase) && <span className="text-xs font-medium text-amber-600">באיחור</span>}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                  {purchase.categoryId && <span>{nameOf.cat.get(purchase.categoryId)}</span>}
                  {purchase.roomId && <span>{nameOf.room.get(purchase.roomId)}</span>}
                  {purchase.vendorId && <span>{nameOf.vendor.get(purchase.vendorId)}</span>}
                  {purchase.orderDate && <span>הזמנה: {formatDate(purchase.orderDate)}</span>}
                  {purchase.deliveryDate && <span>אספקה: {formatDate(purchase.deliveryDate)}</span>}
                  {purchase.link && (
                    <a
                      href={purchase.link}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-teal-600 hover:underline"
                    >
                      קישור
                    </a>
                  )}
                </div>
              </div>

              <div className="mt-2 sm:mt-0">
                <PaidProgress item={purchase} />
              </div>

              <div
                className="mt-2 flex items-center gap-1 sm:mt-0"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <Select
                  options={statusSelectOptions}
                  value={purchase.status}
                  aria-label="שינוי סטטוס"
                  onChange={(e) => updatePurchase(purchase.id, { status: e.target.value as PurchaseStatus })}
                  className="w-28"
                />
                <Button variant="danger" onClick={() => handleDelete(purchase)}>
                  מחיקה
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {creating && <PurchaseFormModal onClose={() => setCreating(false)} />}
      {editing && <PurchaseFormModal purchase={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
