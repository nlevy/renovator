import { differenceInCalendarDays, eachMonthOfInterval, eachWeekOfInterval, format, parseISO } from 'date-fns'
import { he } from 'date-fns/locale'
import { useMemo, useState } from 'react'
import DependencyTree from '../components/DependencyTree'
import { buildDependencyForest } from '../domain/dependencies'
import { buildTimeline, type TimelineItem } from '../domain/timeline'
import { useStore } from '../store/useStore'
import { formatDate } from '../utils/format'

type Zoom = 'fit' | 'week'

const todayIso = () => new Date().toISOString().slice(0, 10)

export default function Timeline() {
  const { tasks, purchases, categories } = useStore()
  const [zoom, setZoom] = useState<Zoom>('fit')

  const today = todayIso()
  const timeline = useMemo(() => buildTimeline(tasks, purchases, today), [tasks, purchases, today])
  const dependencyForest = useMemo(() => buildDependencyForest(tasks), [tasks])
  const colorOf = useMemo(() => new Map(categories.map((c) => [c.id, c.color])), [categories])

  const { range, items, undatedTasks, undatedPurchases, todayPct, warnings } = timeline

  const months = useMemo(() => {
    if (!range) return []
    const total = differenceInCalendarDays(parseISO(range.end), parseISO(range.start)) + 1
    return eachMonthOfInterval({ start: parseISO(range.start), end: parseISO(range.end) }).map((m) => {
      const offset = Math.max(differenceInCalendarDays(m, parseISO(range.start)), 0)
      return { label: format(m, 'MMM yyyy', { locale: he }), offsetPct: (offset / total) * 100 }
    })
  }, [range])

  const weeks = useMemo(() => {
    if (!range) return []
    const start = parseISO(range.start)
    const total = differenceInCalendarDays(parseISO(range.end), start) + 1
    return eachWeekOfInterval({ start, end: parseISO(range.end) }, { weekStartsOn: 0 })
      .map((w) => ({ offsetPct: (differenceInCalendarDays(w, start) / total) * 100, label: format(w, 'dd/MM') }))
      .filter((w) => w.offsetPct > 0 && w.offsetPct < 100)
  }, [range])

  const totalDays = range ? differenceInCalendarDays(parseISO(range.end), parseISO(range.start)) + 1 : 0
  const trackWidth = zoom === 'week' ? `${Math.max(totalDays * 22, 640)}px` : '100%'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">ציר זמן</h2>
        <div className="flex rounded-md border border-slate-200 p-0.5 text-sm">
          {(['fit', 'week'] as Zoom[]).map((z) => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              className={`rounded px-3 py-1 ${zoom === z ? 'bg-teal-600 text-white' : 'text-slate-600'}`}
            >
              {z === 'fit' ? 'תצוגה מלאה' : 'מוגדל'}
            </button>
          ))}
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          <div className="mb-1 font-medium">אזהרות סדר משימות</div>
          <ul className="list-inside list-disc space-y-0.5">
            {warnings.map((w, i) => (
              <li key={i}>
                "{w.taskTitle}" מתחילה לפני ש"{w.depTitle}" מסתיימת
              </li>
            ))}
          </ul>
        </div>
      )}

      {!range ? (
        <p className="rounded-lg bg-white p-6 text-center text-slate-400 shadow-sm">
          אין פריטים עם תאריכים. הוסיפו תאריכים למשימות ולרכישות כדי לראות אותן על ציר הזמן.
        </p>
      ) : (
        <div className="rounded-lg bg-white p-3 shadow-sm">
          <div className="mb-2 text-xs text-slate-400">
            {formatDate(range.start)} – {formatDate(range.end)}
          </div>
          <div className="flex">
            <div className="shrink-0" style={{ width: '9rem' }}>
              <div className="h-10" />
              {items.map((item) => (
                <div key={item.id} className="flex h-9 items-center gap-1 pe-2 text-sm">
                  <span className="truncate" title={item.title}>
                    {item.kind === 'purchase' ? '🛒 ' : ''}
                    {item.title}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex-1 overflow-x-auto">
              <div className="relative" style={{ width: trackWidth, minWidth: '100%' }}>
                <div className="relative h-10 border-b border-slate-100 text-slate-400">
                  {months.map((m, i) => (
                    <span key={i} className="absolute top-0 whitespace-nowrap text-xs font-medium" style={{ insetInlineStart: `${m.offsetPct}%` }}>
                      {m.label}
                    </span>
                  ))}
                  {weeks.map((w, i) => (
                    <span key={i} className="absolute top-5 whitespace-nowrap text-[10px]" style={{ insetInlineStart: `${w.offsetPct}%` }}>
                      {w.label}
                    </span>
                  ))}
                </div>

                {weeks.map((w, i) => (
                  <div
                    key={i}
                    className="pointer-events-none absolute bottom-0 top-10 w-px bg-slate-100"
                    style={{ insetInlineStart: `${w.offsetPct}%` }}
                  />
                ))}

                {todayPct !== null && (
                  <div
                    className="pointer-events-none absolute bottom-0 top-10 z-10 w-px bg-red-400"
                    style={{ insetInlineStart: `${todayPct}%` }}
                    title={`היום ${formatDate(today)}`}
                  />
                )}

                {items.map((item) => (
                  <div key={item.id} className="relative h-9 border-t border-slate-50">
                    <Bar item={item} color={(item.categoryId && colorOf.get(item.categoryId)) || '#94a3b8'} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {(undatedTasks.length > 0 || undatedPurchases.length > 0) && (
        <div className="rounded-lg bg-white p-3 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-slate-600">ללא תאריך</h3>
          <div className="flex flex-wrap gap-2 text-sm">
            {undatedTasks.map((t) => (
              <span key={t.id} className="rounded-full bg-slate-100 px-2 py-0.5">
                {t.title}
              </span>
            ))}
            {undatedPurchases.map((p) => (
              <span key={p.id} className="rounded-full bg-slate-100 px-2 py-0.5">
                🛒 {p.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {dependencyForest.length > 0 && (
        <div className="rounded-lg bg-white p-3 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-600">עץ תלויות</h3>
          <p className="mb-3 text-xs text-slate-400">כל משימה מוצגת מעל המשימות שהיא תלויה בהן.</p>
          <DependencyTree nodes={dependencyForest} />
        </div>
      )}
    </div>
  )
}

function Bar({ item, color }: { item: TimelineItem; color: string }) {
  const ring = item.overdue ? 'ring-2 ring-red-400' : ''
  if (item.isMilestone) {
    return (
      <div
        className="absolute top-1/2 flex -translate-y-1/2 items-center"
        style={{ insetInlineStart: `${item.offsetPct}%` }}
        title={`${item.title} · ${formatDate(item.start)}`}
      >
        <span className={`block h-3 w-3 -translate-x-1/2 rotate-45 ${ring}`} style={{ backgroundColor: color }} />
      </div>
    )
  }
  return (
    <div
      className={`absolute top-1/2 h-5 -translate-y-1/2 rounded ${ring}`}
      style={{ insetInlineStart: `${item.offsetPct}%`, width: `${item.widthPct}%`, backgroundColor: color, minWidth: '4px' }}
      title={`${item.title} · ${formatDate(item.start)} – ${formatDate(item.end)}`}
    />
  )
}
