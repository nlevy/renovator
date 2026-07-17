import { describe, expect, it } from 'vitest'
import { contactUsage } from './contacts'
import { payment, purchase, task } from '../test/fixtures'

const LATER = '2026-12-31' // after every fixture payment date

describe('contactUsage', () => {
  const tasks = [
    task({ contactId: 'c1', payments: [payment(3000), payment(1000)] }),
    task({ contactId: 'c1', payments: [payment(500)] }),
    task({ contactId: 'c2', payments: [payment(9999)] }),
    task({ payments: [payment(100)] }),
  ]
  const purchases = [
    purchase({ vendorId: 'c1', payments: [payment(2000)] }),
    purchase({ vendorId: 'c2' }),
  ]

  it('collects linked tasks and purchases', () => {
    const usage = contactUsage('c1', tasks, purchases, LATER)
    expect(usage.tasks).toHaveLength(2)
    expect(usage.purchases).toHaveLength(1)
    expect(usage.linkedCount).toBe(3)
  })

  it('sums total paid across linked tasks and purchases', () => {
    expect(contactUsage('c1', tasks, purchases, LATER).totalPaid).toBe(6500)
  })

  it('returns zeros for an unused contact', () => {
    expect(contactUsage('nobody', tasks, purchases, LATER)).toEqual({
      tasks: [],
      purchases: [],
      totalPaid: 0,
      linkedCount: 0,
    })
  })
})
