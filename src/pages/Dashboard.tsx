import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ImportButton from '../components/ImportButton'
import { buildDashboard, statusBreakdown, type EventType, type TimingScope } from '../domain/dashboard'
import { moveTimingLabels, purchaseStatusLabels, taskStatusLabels } from '../domain/labels'
import { useStore } from '../store/useStore'
import { formatCurrency, formatDate } from '../utils/format'

const eventTypeLabels: Record<EventType, string> = {
  start: 'התחלה',
  end: 'סיום',
  order: 'הזמנה',
  delivery: 'אספקה',
}

const timingScopes: { value: TimingScope; label: string }[] = [
  { value: 'all', label: 'הכל' },
  { value: 'before', label: moveTimingLabels.before },
  { value: 'after', label: moveTimingLabels.after },
]

const todayIso = () => new Date().toISOString().slice(0, 10)

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  )
}

export default function Dashboard() {
  const { tasks, purchases } = useStore()
  const today = todayIso()
  const d = useMemo(() => buildDashboard(tasks, purchases, today), [tasks, purchases, today])

  const [timingScope, setTimingScope] = useState<TimingScope>('all')
  const taskStatusCounts = useMemo(
    () => statusBreakdown(tasks, taskStatusLabels, timingScope),
    [tasks, timingScope],
  )
  const purchaseStatusCounts = useMemo(
    () => statusBreakdown(purchases, purchaseStatusLabels, timingScope),
    [purchases, timingScope],
  )

  if (tasks.length === 0 && purchases.length === 0) {
    return (
      <div>
        <h2 className="mb-4 text-lg font-semibold">לוח בקרה</h2>
        <div className="rounded-lg bg-white p-6 text-center text-slate-500 shadow-sm">
          <p className="mb-3">ברוכים הבאים! הפרויקט עדיין ריק.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link to="/tasks" className="rounded-md bg-teal-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-700">
              הוספת משימה
            </Link>
            <Link to="/purchases" className="rounded-md border border-teal-600 px-4 py-1.5 text-sm font-medium text-teal-700 hover:bg-teal-50">
              הוספת רכישה
            </Link>
            <ImportButton
              confirmReplace={false}
              className="rounded-md border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              ייבוא מקובץ
            </ImportButton>
          </div>
          <p className="mt-3 text-xs text-slate-400">כבר יש לכם קובץ גיבוי? ייבאו אותו כדי להמשיך מאיפה שהפסקתם.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">לוח בקרה</h2>

      <Link to="/budget" className="block rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xs text-slate-500">עלות צפויה</div>
            <div className="mt-1 font-bold">{formatCurrency(d.budget.expected)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">שולם</div>
            <div className="mt-1 font-bold text-green-600">{formatCurrency(d.budget.paid)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">נותר לתשלום</div>
            <div className="mt-1 font-bold">{formatCurrency(d.budget.expected - d.budget.paid)}</div>
          </div>
        </div>
      </Link>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="grid grid-cols-2 gap-4 rounded-lg bg-white p-4 shadow-sm">
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-slate-500">משימות שהושלמו</span>
              <span className="font-bold">
                {d.doneTasks}/{d.totalTasks}
              </span>
            </div>
            <ProgressBar pct={d.taskProgressPct} color="bg-teal-500" />
            <div className="mt-1 text-xs text-slate-400">{d.taskProgressPct}%</div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-slate-500">רכישות שסופקו</span>
              <span className="font-bold">
                {d.deliveredPurchases}/{d.totalPurchases}
              </span>
            </div>
            <ProgressBar pct={d.purchaseProgressPct} color="bg-blue-500" />
            <div className="mt-1 text-xs text-slate-400">{d.purchaseProgressPct}%</div>
          </div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-slate-500">תשלום מהתקציב</span>
            <span className="font-bold">{d.budgetPaidPct}%</span>
          </div>
          <ProgressBar pct={d.budgetPaidPct} color="bg-green-500" />
          <div className="mt-1 text-xs text-slate-400">
            {formatCurrency(d.budget.paid)} מתוך {formatCurrency(d.budget.expected)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="rounded-lg bg-white p-4 shadow-sm">
          <h3 className="mb-2 font-semibold">השבוע הקרוב</h3>
          {d.upcoming.length === 0 ? (
            <p className="text-sm text-slate-400">אין אירועים בשבוע הקרוב.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {d.upcoming.map((e, i) => (
                <li key={`${e.id}-${e.type}-${i}`} className="flex items-center justify-between py-2 text-sm">
                  <Link to={e.kind === 'task' ? '/tasks' : '/purchases'} className="hover:underline">
                    {e.kind === 'purchase' ? '🛒 ' : ''}
                    {e.title}
                    <span className="text-slate-400"> · {eventTypeLabels[e.type]}</span>
                  </Link>
                  <span className="text-slate-500">{formatDate(e.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg bg-white p-4 shadow-sm">
          <h3 className="mb-2 font-semibold">דורש תשומת לב</h3>
          {d.attention.length === 0 ? (
            <p className="text-sm text-slate-400">אין פריטים שדורשים טיפול. כל הכבוד!</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {d.attention.map((a) => (
                <li key={`${a.id}-${a.reason}`} className="flex items-center justify-between py-2 text-sm">
                  <Link to={a.kind === 'task' ? '/tasks' : '/purchases'} className="hover:underline">
                    {a.kind === 'purchase' ? '🛒 ' : ''}
                    {a.title}
                  </Link>
                  <span className={a.reason === 'overdue' ? 'text-red-600' : 'text-amber-600'}>
                    {a.reason === 'overdue' ? 'באיחור' : 'תקוע'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">פילוח לפי סטטוס</h3>
          <div className="flex rounded-md border border-slate-200 p-0.5 text-sm">
            {timingScopes.map((s) => (
              <button
                key={s.value}
                onClick={() => setTimingScope(s.value)}
                className={`rounded px-3 py-1 ${
                  timingScope === s.value ? 'bg-teal-600 text-white' : 'text-slate-600'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <StatusBreakdown title="משימות" counts={taskStatusCounts} />
          <StatusBreakdown title="רכישות" counts={purchaseStatusCounts} />
        </div>
      </div>
    </div>
  )
}

function StatusBreakdown({
  title,
  counts,
}: {
  title: string
  counts: { label: string; count: number }[]
}) {
  return (
    <section className="rounded-lg bg-white p-4 shadow-sm">
      <h3 className="mb-2 font-semibold">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {counts.map((c) => (
          <span
            key={c.label}
            className={`rounded-full px-2.5 py-1 text-sm ${
              c.count ? 'bg-slate-100 text-slate-700' : 'bg-slate-50 text-slate-400'
            }`}
          >
            {c.label} <span className="font-semibold">{c.count}</span>
          </span>
        ))}
      </div>
    </section>
  )
}
