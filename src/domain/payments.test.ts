import { describe, expect, it } from 'vitest'
import { generateInstallments } from './payments'

describe('generateInstallments', () => {
  it('splits a total evenly across monthly dates', () => {
    const result = generateInstallments(1000, 5, '2026-08-01')
    expect(result).toHaveLength(5)
    expect(result.map((p) => p.amount)).toEqual([200, 200, 200, 200, 200])
    expect(result.map((p) => p.date)).toEqual([
      '2026-08-01',
      '2026-09-01',
      '2026-10-01',
      '2026-11-01',
      '2026-12-01',
    ])
    expect(result.every((p) => p.method === 'credit')).toBe(true)
    expect(result[0].note).toBe('תשלום 1/5')
  })

  it('distributes rounding remainder to the earliest payments and sums exactly', () => {
    const result = generateInstallments(100, 3, '2026-08-01')
    expect(result.map((p) => p.amount)).toEqual([33.34, 33.33, 33.33])
    expect(result.reduce((s, p) => s + p.amount, 0)).toBeCloseTo(100)
  })

  it('handles a single payment', () => {
    const result = generateInstallments(500, 1, '2026-08-15')
    expect(result).toEqual([{ amount: 500, date: '2026-08-15', method: 'credit', note: 'תשלום 1/1' }])
  })

  it('rolls month-end dates forward correctly', () => {
    const result = generateInstallments(300, 3, '2026-01-31')
    // date-fns addMonths clamps to the last valid day of shorter months
    expect(result.map((p) => p.date)).toEqual(['2026-01-31', '2026-02-28', '2026-03-31'])
  })

  it('returns nothing for an invalid count', () => {
    expect(generateInstallments(1000, 0, '2026-08-01')).toEqual([])
  })
})
