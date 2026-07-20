import { SCHEMA_VERSION, type AppData, type Payment, type Purchase, type Task } from '../domain/schemas'

export function payment(amount: number, over: Partial<Payment> = {}): Payment {
  return { id: crypto.randomUUID(), amount, date: '2026-07-01', method: 'cash', note: '', ...over }
}

export function task(over: Partial<Task> = {}): Task {
  return {
    id: crypto.randomUUID(),
    title: 'משימה',
    description: '',
    status: 'not_started',
    payments: [],
    moveTiming: 'either',
    dependsOn: [],
    notes: '',
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...over,
  }
}

export function purchase(over: Partial<Purchase> = {}): Purchase {
  return {
    id: crypto.randomUUID(),
    title: 'רכישה',
    status: 'to_buy',
    quantity: 1,
    payments: [],
    moveTiming: 'either',
    notes: '',
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...over,
  }
}

export function sampleData(): AppData {
  const contactId = crypto.randomUUID()
  const categoryId = crypto.randomUUID()
  const roomId = crypto.randomUUID()
  return {
    schemaVersion: SCHEMA_VERSION,
    tasks: [
      task({
        title: 'החלפת אינסטלציה',
        categoryId,
        roomId,
        contactId,
        status: 'in_progress',
        price: 10000,
        payments: [payment(3000, { note: 'מקדמה' })],
        startDate: '2026-08-01',
        endDate: '2026-08-10',
      }),
    ],
    purchases: [
      purchase({
        title: 'ברז למטבח',
        categoryId,
        roomId,
        vendorId: contactId,
        status: 'ordered',
        estimatedPrice: 800,
        orderDate: '2026-08-05',
        deliveryDate: '2026-08-20',
      }),
    ],
    contacts: [
      { id: contactId, name: 'יוסי האינסטלטור', role: 'אינסטלטור', phone: '050-1234567', email: '', notes: '' },
    ],
    categories: [{ id: categoryId, name: 'אינסטלציה', color: '#0ea5e9' }],
    rooms: [{ id: roomId, name: 'מטבח' }],
    settings: { budgetCap: 250000 },
  }
}
