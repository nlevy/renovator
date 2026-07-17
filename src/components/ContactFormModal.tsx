import { useState } from 'react'
import type { Contact } from '../domain/schemas'
import { useStore, type NewContact } from '../store/useStore'
import Button from './ui/Button'
import Modal from './ui/Modal'
import { Field, Textarea, TextInput } from './ui/fields'

function blankDraft(): NewContact {
  return { name: '', role: '', phone: '', email: '', notes: '' }
}

interface Props {
  contact?: Contact
  onClose: () => void
}

export default function ContactFormModal({ contact, onClose }: Props) {
  const { addContact, updateContact } = useStore()
  const [draft, setDraft] = useState<NewContact>(() => {
    if (!contact) return blankDraft()
    const { id: _id, ...rest } = contact
    return rest
  })
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof NewContact>(key: K, value: NewContact[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const submit = () => {
    if (!draft.name.trim()) {
      setError('יש להזין שם')
      return
    }
    if (contact) {
      updateContact(contact.id, draft)
    } else {
      addContact(draft)
    }
    onClose()
  }

  return (
    <Modal
      title={contact ? 'עריכת איש קשר' : 'איש קשר חדש'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            ביטול
          </Button>
          <Button onClick={submit}>שמירה</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>}
        <Field label="שם">
          <TextInput value={draft.name} autoFocus onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label="תפקיד / מקצוע">
          <TextInput
            value={draft.role}
            placeholder="למשל: אינסטלטור, חנות ריצוף"
            onChange={(e) => set('role', e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="טלפון">
            <TextInput type="tel" value={draft.phone} onChange={(e) => set('phone', e.target.value)} />
          </Field>
          <Field label="אימייל">
            <TextInput type="email" value={draft.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
        </div>
        <Field label="הערות">
          <Textarea rows={2} value={draft.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}
