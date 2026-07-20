import { z } from 'zod'

export const SCHEMA_VERSION = 1

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'תאריך חייב להיות בפורמט YYYY-MM-DD')

export const PaymentMethodSchema = z.enum(['cash', 'transfer', 'check', 'credit', 'other'])

export const PaymentSchema = z.object({
  id: z.string(),
  amount: z.number().nonnegative(),
  date: isoDate,
  method: PaymentMethodSchema.default('other'),
  note: z.string().default(''),
})

export const TaskStatusSchema = z.enum(['not_started', 'scheduled', 'in_progress', 'stuck', 'done', 'cancelled'])
export const PurchaseStatusSchema = z.enum(['to_buy', 'ordered', 'delivered', 'cancelled'])

// timing relative to moving into the home
export const MoveTimingSchema = z.enum(['before', 'after', 'either'])

const payableFields = {
  id: z.string(),
  title: z.string().min(1),
  categoryId: z.string().optional(),
  roomId: z.string().optional(),
  price: z.number().nonnegative().optional(),
  estimatedPrice: z.number().nonnegative().optional(),
  payments: z.array(PaymentSchema).default([]),
  moveTiming: MoveTimingSchema.default('either'),
  notes: z.string().default(''),
  createdAt: z.string(),
  updatedAt: z.string(),
}

export const TaskSchema = z.object({
  ...payableFields,
  description: z.string().default(''),
  contactId: z.string().optional(),
  status: TaskStatusSchema,
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
  dependsOn: z.array(z.string()).default([]),
})

export const PurchaseSchema = z.object({
  ...payableFields,
  vendorId: z.string().optional(),
  status: PurchaseStatusSchema,
  quantity: z.number().positive().default(1),
  orderDate: isoDate.optional(),
  deliveryDate: isoDate.optional(),
  link: z.string().optional(),
})

export const ContactSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  role: z.string().default(''),
  phone: z.string().default(''),
  email: z.string().default(''),
  notes: z.string().default(''),
})

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  color: z.string().default('#64748b'),
})

export const RoomSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
})

export const SettingsSchema = z.object({
  budgetCap: z.number().positive().optional(),
  lastExportAt: z.string().optional(),
})

export const AppDataSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  tasks: z.array(TaskSchema).default([]),
  purchases: z.array(PurchaseSchema).default([]),
  contacts: z.array(ContactSchema).default([]),
  categories: z.array(CategorySchema).default([]),
  rooms: z.array(RoomSchema).default([]),
  settings: SettingsSchema.default({}),
})

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>
export type Payment = z.infer<typeof PaymentSchema>
export type TaskStatus = z.infer<typeof TaskStatusSchema>
export type PurchaseStatus = z.infer<typeof PurchaseStatusSchema>
export type MoveTiming = z.infer<typeof MoveTimingSchema>
export type Task = z.infer<typeof TaskSchema>
export type Purchase = z.infer<typeof PurchaseSchema>
export type Contact = z.infer<typeof ContactSchema>
export type Category = z.infer<typeof CategorySchema>
export type Room = z.infer<typeof RoomSchema>
export type Settings = z.infer<typeof SettingsSchema>
export type AppData = z.infer<typeof AppDataSchema>
