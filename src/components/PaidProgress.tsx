import { effectivePrice, paidAmount, scheduledAmount, type Payable } from '../domain/derive'
import { formatCurrency, todayIso } from '../utils/format'

export default function PaidProgress({ item }: { item: Payable }) {
  const today = todayIso()
  const price = effectivePrice(item)
  const paid = paidAmount(item, today)
  const scheduled = scheduledAmount(item, today)
  const isEstimate = item.price === undefined && item.estimatedPrice !== undefined

  const paidPct = price > 0 ? Math.min((paid / price) * 100, 100) : 0
  const committedPct = price > 0 ? Math.min(((paid + scheduled) / price) * 100, 100) : 0

  return (
    <div className="min-w-32">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">
          {paid > 0 && <span className="text-slate-500">{formatCurrency(paid)} / </span>}
          <span className={isEstimate ? 'italic text-slate-500' : ''}>
            {price > 0 ? `${isEstimate ? '~' : ''}${formatCurrency(price)}` : '—'}
          </span>
        </span>
      </div>
      {price > 0 && (
        <div className="relative mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="absolute inset-y-0 start-0 bg-amber-300" style={{ width: `${committedPct}%` }} />
          <div className="absolute inset-y-0 start-0 bg-green-500" style={{ width: `${paidPct}%` }} />
        </div>
      )}
      {scheduled > 0 && (
        <div className="mt-0.5 text-xs text-amber-600">+ {formatCurrency(scheduled)} מתוכנן</div>
      )}
    </div>
  )
}
