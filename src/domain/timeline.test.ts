import { describe, expect, it } from 'vitest'
import { buildTimeline, dependencyWarnings, timelineRange } from './timeline'
import { purchase, task } from '../test/fixtures'

describe('timelineRange', () => {
  it('spans the earliest and latest dates, using only delivery dates for purchases', () => {
    const tasks = [task({ startDate: '2026-08-05', endDate: '2026-08-10' }), task({ startDate: '2026-08-01' })]
    // order date 2026-07-20 is ignored; only the delivery date counts
    const purchases = [purchase({ orderDate: '2026-07-20', deliveryDate: '2026-08-25' })]
    expect(timelineRange(tasks, purchases)).toEqual({ start: '2026-08-01', end: '2026-08-25' })
  })

  it('treats a purchase with only an order date as undated', () => {
    expect(timelineRange([], [purchase({ orderDate: '2026-07-20' })])).toBeNull()
  })

  it('is null when nothing is dated', () => {
    expect(timelineRange([task()], [purchase()])).toBeNull()
  })
})

describe('buildTimeline', () => {
  const tasks = [
    task({ title: 'הריסה', startDate: '2026-08-01', endDate: '2026-08-10', status: 'in_progress' }),
    task({ title: 'צבע', startDate: '2026-08-20', status: 'not_started' }),
    task({ title: 'ללא תאריך' }),
  ]
  const purchases = [
    purchase({ title: 'ברז', deliveryDate: '2026-08-15' }),
    purchase({ title: 'תנור' }),
  ]

  it('separates dated items from undated ones', () => {
    const tl = buildTimeline(tasks, purchases, '2026-08-05')
    expect(tl.items.map((i) => i.title)).toEqual(['הריסה', 'ברז', 'צבע'])
    expect(tl.undatedTasks).toHaveLength(1)
    expect(tl.undatedPurchases.map((p) => p.title)).toEqual(['תנור'])
  })

  it('marks single-date items as milestones', () => {
    const tl = buildTimeline(tasks, purchases, '2026-08-05')
    expect(tl.items.find((i) => i.title === 'ברז')!.isMilestone).toBe(true)
    expect(tl.items.find((i) => i.title === 'הריסה')!.isMilestone).toBe(false)
  })

  it('positions the first item at offset 0 and spans full range width', () => {
    // range is 2026-08-01 .. 2026-08-20 = 20 days
    const tl = buildTimeline(tasks, purchases, '2026-08-05')
    const demolition = tl.items.find((i) => i.title === 'הריסה')!
    expect(demolition.offsetPct).toBe(0)
    expect(demolition.widthPct).toBeCloseTo((10 / 20) * 100)
  })

  it('flags overdue active items and ignores done ones', () => {
    const overdueTasks = [
      task({ title: 'באיחור', startDate: '2026-08-01', endDate: '2026-08-05', status: 'in_progress' }),
      task({ title: 'הושלם', startDate: '2026-08-01', endDate: '2026-08-05', status: 'done' }),
    ]
    const tl = buildTimeline(overdueTasks, [], '2026-08-10')
    expect(tl.items.find((i) => i.title === 'באיחור')!.overdue).toBe(true)
    expect(tl.items.find((i) => i.title === 'הושלם')!.overdue).toBe(false)
  })

  it('computes today position within range', () => {
    const tl = buildTimeline(tasks, purchases, '2026-08-11')
    // day 10 of a 20-day range
    expect(tl.todayPct).toBeCloseTo((10 / 20) * 100)
  })

  it('reports no today marker when today is outside the range', () => {
    expect(buildTimeline(tasks, purchases, '2027-01-01').todayPct).toBeNull()
  })
})

describe('dependencyWarnings', () => {
  it('warns when a task starts before its dependency ends', () => {
    const dep = task({ title: 'גבס', startDate: '2026-08-01', endDate: '2026-08-15' })
    const paint = task({ title: 'צבע', startDate: '2026-08-10', dependsOn: [dep.id] })
    expect(dependencyWarnings([dep, paint])).toEqual([
      { taskId: paint.id, taskTitle: 'צבע', depTitle: 'גבס' },
    ])
  })

  it('does not warn when ordering is correct', () => {
    const dep = task({ title: 'גבס', startDate: '2026-08-01', endDate: '2026-08-05' })
    const paint = task({ title: 'צבע', startDate: '2026-08-10', dependsOn: [dep.id] })
    expect(dependencyWarnings([dep, paint])).toEqual([])
  })

  it('ignores tasks without a start date', () => {
    const dep = task({ title: 'גבס', startDate: '2026-08-01', endDate: '2026-08-15' })
    const paint = task({ title: 'צבע', dependsOn: [dep.id] })
    expect(dependencyWarnings([dep, paint])).toEqual([])
  })
})
