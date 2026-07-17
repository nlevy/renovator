import { useState } from 'react'
import Button from './ui/Button'
import { TextInput } from './ui/fields'

interface Item {
  id: string
  name: string
}

interface Props {
  title: string
  items: Item[]
  onAdd: (name: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  deleteWarning: (name: string) => string
}

export default function TaxonomyManager({ title, items, onAdd, onRename, onDelete, deleteWarning }: Props) {
  const [newName, setNewName] = useState('')

  const add = () => {
    const name = newName.trim()
    if (!name) return
    onAdd(name)
    setNewName('')
  }

  const remove = (item: Item) => {
    if (window.confirm(deleteWarning(item.name))) onDelete(item.id)
  }

  return (
    <section className="rounded-lg bg-white p-4 shadow-sm">
      <h3 className="mb-2 font-semibold">{title}</h3>
      <ul className="mb-3 divide-y divide-slate-100">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2 py-1.5">
            <TextInput
              value={item.name}
              onChange={(e) => onRename(item.id, e.target.value)}
              className="flex-1"
            />
            <Button variant="danger" onClick={() => remove(item)}>
              מחיקה
            </Button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <TextInput
          value={newName}
          placeholder="הוספה חדשה…"
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          className="flex-1"
        />
        <Button variant="secondary" onClick={add}>
          הוספה
        </Button>
      </div>
    </section>
  )
}
