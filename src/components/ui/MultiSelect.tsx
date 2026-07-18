import { useEffect, useRef, useState } from 'react'

export interface MultiSelectOption {
  value: string
  label: string
}

interface Props {
  // shown when nothing is selected (means "all")
  allLabel: string
  options: MultiSelectOption[]
  selected: string[]
  onChange: (selected: string[]) => void
}

export default function MultiSelect({ allLabel, options, selected, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])

  const summary =
    selected.length === 0
      ? allLabel
      : selected.length === 1
        ? (options.find((o) => o.value === selected[0])?.label ?? `${selected.length}`)
        : `${selected.length} נבחרו`

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-1 rounded-md border px-3 py-1.5 text-sm ${
          selected.length ? 'border-teal-400 bg-teal-50 text-teal-800' : 'border-slate-300 bg-white text-slate-700'
        }`}
      >
        <span className="truncate">{summary}</span>
        <span className="text-xs text-slate-400">▾</span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 max-h-64 w-full min-w-44 overflow-y-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg">
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mb-1 block w-full rounded px-2 py-1 text-start text-xs text-slate-500 hover:bg-slate-100"
            >
              ניקוי הבחירה
            </button>
          )}
          {options.map((o) => (
            <label
              key={o.value}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={selected.includes(o.value)}
                onChange={() => toggle(o.value)}
              />
              <span className="truncate">{o.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
