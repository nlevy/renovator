import { useMemo, useState } from 'react'
import { TaskStatusBadge, PurchaseStatusBadge } from '../components/StatusBadge'
import PaidProgress from '../components/PaidProgress'
import { buildBudgetReport, itemsInGroup, type GroupBy } from '../domain/budget'
import type { Purchase, Task } from '../domain/schemas'
import { useStore } from '../store/useStore'
import { formatCurrency, todayIso } from '../utils/format'

function isTask(item: Task | Purchase): item is Task {
  return 'dependsOn' in item
}

function PaidBar({ paid, expected }: { paid: number; expected: number }) {
  const ratio = expected > 0 ? Math.min(paid / expected, 1) : 0
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className="h-full bg-green-500" style={{ width: `${ratio * 100}%` }} />
    </div>
  )
}

export default function Budget() {
  const { tasks, purchases, categories, rooms, settings } = useStore()
  const [groupBy, setGroupBy] = useState<GroupBy>('category')
  const [openKey, setOpenKey] = useState<string | null>(null)

  const today = todayIso()
  const report = useMemo(
    () => buildBudgetReport(tasks, purchases, { groupBy, categories, rooms, today, cap: settings.budgetCap }),
    [tasks, purchases, categories, rooms, groupBy, today, settings.budgetCap],
  )

  const hasData = tasks.length + purchases.length > 0
  const { totals, remaining, cap } = report

  const cards = [
    { label: 'עלות צפויה', value: totals.expected, tone: 'text-slate-900' },
    { label: 'שולם', value: totals.paid, tone: 'text-green-600' },
    { label: 'נותר לתשלום', value: remaining, tone: 'text-slate-900' },
    { label: 'מחויב וטרם שולם', value: totals.committedUnpaid, tone: 'text-amber-600' },
    { label: 'עדיין באומדן', value: totals.estimated, tone: 'text-slate-500' },
  ]

  if (!hasData) {
    return (
      <div>
        <h2 className="mb-4 text-lg font-semibold">תקציב</h2>
        <p className="rounded-lg bg-white p-6 text-center text-slate-400 shadow-sm">
          אין עדיין נתונים. הוסיפו משימות ורכישות כדי לראות את התקציב.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">תקציב</h2>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg bg-white p-4 shadow-sm">
            <div className="text-xs text-slate-500">{card.label}</div>
            <div className={`mt-1 text-lg font-bold ${card.tone}`}>{formatCurrency(card.value)}</div>
          </div>
        ))}
      </div>

      {cap && (
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">מול תקציב כולל</span>
            <span className={cap.over ? 'font-semibold text-red-600' : 'text-slate-500'}>
              {cap.over
                ? `חריגה של ${formatCurrency(-cap.remaining)}`
                : `נותרו ${formatCurrency(cap.remaining)}`}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full ${cap.over ? 'bg-red-500' : 'bg-teal-500'}`}
              style={{ width: `${Math.min((totals.expected / cap.amount) * 100, 100)}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-slate-400">
            צפוי {formatCurrency(totals.expected)} מתוך {formatCurrency(cap.amount)}
          </div>
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">פילוח</h3>
          <div className="flex rounded-md border border-slate-200 p-0.5 text-sm">
            {(['category', 'room'] as GroupBy[]).map((g) => (
              <button
                key={g}
                onClick={() => {
                  setGroupBy(g)
                  setOpenKey(null)
                }}
                className={`rounded px-3 py-1 ${groupBy === g ? 'bg-teal-600 text-white' : 'text-slate-600'}`}
              >
                {g === 'category' ? 'לפי קטגוריה' : 'לפי חדר'}
              </button>
            ))}
          </div>
        </div>

        <ul className="space-y-2">
          {report.rows.map((row) => {
            const open = openKey === row.key
            return (
              <li key={row.key} className="rounded-lg bg-white shadow-sm">
                <button
                  onClick={() => setOpenKey(open ? null : row.key)}
                  className="w-full px-4 py-3 text-start"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium">
                      {open ? '▾' : '◂'} {row.name}
                    </span>
                    <span className="text-sm">
                      <span className="text-green-600">{formatCurrency(row.totals.paid)}</span>
                      <span className="text-slate-400"> / {formatCurrency(row.totals.expected)}</span>
                    </span>
                  </div>
                  <div className="mt-2">
                    <PaidBar paid={row.totals.paid} expected={row.totals.expected} />
                  </div>
                  {row.totals.estimated > 0 && (
                    <div className="mt-1 text-xs text-slate-400">
                      כולל {formatCurrency(row.totals.estimated)} באומדן
                    </div>
                  )}
                </button>

                {open && (
                  <ul className="divide-y divide-slate-100 border-t border-slate-100 px-4 py-2">
                    {itemsInGroup(tasks, purchases, groupBy, row.key).map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-3 py-2">
                        <span className="flex items-center gap-2 text-sm">
                          {isTask(item) ? (
                            <TaskStatusBadge status={item.status} />
                          ) : (
                            <PurchaseStatusBadge status={item.status} />
                          )}
                          {item.title}
                        </span>
                        <PaidProgress item={item} />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
