import { statusPresetLabels } from '../domain/labels'
import { statusPresets, type StatusPreset } from '../domain/statusPresets'

interface Props {
  // the preset the current status selection matches, or null for a custom set
  active: StatusPreset | null
  onSelect: (preset: StatusPreset) => void
}

export default function StatusPresetChips({ active, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-1">
      {statusPresets.map((preset) => (
        <button
          key={preset}
          type="button"
          aria-pressed={active === preset}
          onClick={() => onSelect(preset)}
          className={`rounded-full border px-3 py-1 text-sm transition-colors ${
            active === preset
              ? 'border-teal-500 bg-teal-600 text-white'
              : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          {statusPresetLabels[preset]}
        </button>
      ))}
    </div>
  )
}
