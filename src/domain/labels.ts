import type { PaymentMethod, PurchaseStatus, TaskStatus } from './schemas'

export const taskStatusLabels: Record<TaskStatus, string> = {
  not_started: 'לא התחיל',
  scheduled: 'מתואם',
  in_progress: 'בתהליך',
  stuck: 'תקוע',
  done: 'הושלם',
  cancelled: 'בוטל',
}

export const purchaseStatusLabels: Record<PurchaseStatus, string> = {
  to_buy: 'לקנות',
  ordered: 'הוזמן',
  delivered: 'סופק',
  cancelled: 'בוטל',
}

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'מזומן',
  transfer: 'העברה בנקאית',
  check: "צ'ק",
  credit: 'אשראי',
  other: 'אחר',
}

export const paymentStatusLabels = {
  unpaid: 'לא שולם',
  partial: 'שולם חלקית',
  paid: 'שולם',
} as const
