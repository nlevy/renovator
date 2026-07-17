import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { buildDashboard, type EventType } from '../domain/dashboard'
import { useStore } from '../store/useStore'
import { formatCurrency, formatDate } from '../utils/format'

const eventTypeLabels: Record<EventType, string> = {
  start: 'התחלה',
  end: 'סיום',
  order: 'הזמנה',
  delivery: 'אספקה',
}

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

  if (tasks.length === 0 && purchases.length === 0) {
    return (
      <div>
        <h2 className="mb-4 text-lg font-semibold">לוח בקרה</h2>
        <div className="rounded-lg bg-white p-6 text-center text-slate-500 shadow-sm">
          <p className="mb-3">ברוכים הבאים! הפרויקט עדיין ריק.</p>
          <div className="flex justify-center gap-2">
            <Link to="/tasks" className="rounded-md bg-teal-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-700">
              הוספת משימה
            </Link>
            <Link to="/purchases" className="rounded-md border border-teal-600 px-4 py-1.5 text-sm font-medium text-teal-700 hover:bg-teal-50">
              הוספת רכישה
            </Link>
          </div>
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

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-slate-500">משימות שהושלמו</span>
            <span className="font-bold">
              {d.doneTasks}/{d.totalTasks}
            </span>
          </div>
          <ProgressBar pct={d.taskProgressPct} color="bg-teal-500" />
          <div className="mt-1 text-xs text-slate-400">{d.taskProgressPct}%</div>
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
    </div>
  )
}
