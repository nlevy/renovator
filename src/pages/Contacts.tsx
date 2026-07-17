import { useMemo, useState } from 'react'
import ContactFormModal from '../components/ContactFormModal'
import Button from '../components/ui/Button'
import { Select, TextInput } from '../components/ui/fields'
import { contactUsage } from '../domain/contacts'
import type { Contact } from '../domain/schemas'
import { useStore } from '../store/useStore'
import { formatCurrency, todayIso } from '../utils/format'

export default function Contacts() {
  const { contacts, tasks, purchases, deleteContact } = useStore()
  const today = todayIso()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('all')
  const [editing, setEditing] = useState<Contact | null>(null)
  const [creating, setCreating] = useState(false)

  const roles = useMemo(
    () => [...new Set(contacts.map((c) => c.role.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'he')),
    [contacts],
  )

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    return contacts
      .filter((c) => (role === 'all' ? true : c.role.trim() === role))
      .filter((c) => (query ? `${c.name} ${c.role} ${c.phone} ${c.email}`.toLowerCase().includes(query) : true))
      .sort((a, b) => a.name.localeCompare(b.name, 'he'))
  }, [contacts, search, role])

  const handleDelete = (contact: Contact) => {
    const usage = contactUsage(contact.id, tasks, purchases, today)
    const suffix = usage.linkedCount > 0 ? ` הוא מקושר ל-${usage.linkedCount} פריטים, שינותקו ממנו.` : ''
    if (window.confirm(`למחוק את "${contact.name}"?${suffix}`)) deleteContact(contact.id)
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">אנשי קשר ({contacts.length})</h2>
        <Button onClick={() => setCreating(true)}>+ איש קשר חדש</Button>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <TextInput placeholder="חיפוש…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select
          options={[{ value: 'all', label: 'כל התפקידים' }, ...roles.map((r) => ({ value: r, label: r }))]}
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />
      </div>

      {visible.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-center text-slate-400 shadow-sm">
          {contacts.length === 0 ? 'עדיין אין אנשי קשר.' : 'אין אנשי קשר תואמים.'}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {visible.map((contact) => {
            const usage = contactUsage(contact.id, tasks, purchases, today)
            return (
              <li key={contact.id} className="rounded-lg bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium">{contact.name}</div>
                    {contact.role && <div className="text-sm text-slate-500">{contact.role}</div>}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" onClick={() => setEditing(contact)}>
                      עריכה
                    </Button>
                    <Button variant="danger" onClick={() => handleDelete(contact)}>
                      מחיקה
                    </Button>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-3 text-sm">
                  {contact.phone && (
                    <a href={`tel:${contact.phone}`} className="text-teal-600 hover:underline" dir="ltr">
                      📞 {contact.phone}
                    </a>
                  )}
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="text-teal-600 hover:underline" dir="ltr">
                      ✉️ {contact.email}
                    </a>
                  )}
                </div>

                {contact.notes && <p className="mt-2 text-sm text-slate-500">{contact.notes}</p>}

                {usage.linkedCount > 0 && (
                  <div className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-500">
                    {usage.tasks.length > 0 && <span className="me-3">{usage.tasks.length} משימות</span>}
                    {usage.purchases.length > 0 && <span className="me-3">{usage.purchases.length} רכישות</span>}
                    {usage.totalPaid > 0 && <span>שולם לו סה"כ: {formatCurrency(usage.totalPaid)}</span>}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {creating && <ContactFormModal onClose={() => setCreating(false)} />}
      {editing && <ContactFormModal contact={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
