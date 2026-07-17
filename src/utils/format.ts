import { format, parseISO } from 'date-fns'

const currencyFormatter = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  maximumFractionDigits: 0,
})

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount)
}

export function formatDate(isoDate: string): string {
  return format(parseISO(isoDate), 'dd/MM/yyyy')
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}
