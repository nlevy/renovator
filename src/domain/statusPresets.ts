// Quick status filters: one click selects every status that counts as "open"
// (still needs work) or "closed" (finished or cancelled — nothing left to do).
// Between them the two presets cover every status.
export type StatusPreset = 'open' | 'closed'

export type StatusPresetMap<S extends string> = Record<StatusPreset, S[]>

export const statusPresets: StatusPreset[] = ['open', 'closed']

function sameSet<S extends string>(a: S[], b: S[]): boolean {
  return a.length === b.length && a.every((value) => b.includes(value))
}

// which preset the current selection represents, or null for a custom set
export function activePreset<S extends string>(
  selected: S[],
  presets: StatusPresetMap<S>,
): StatusPreset | null {
  return statusPresets.find((preset) => sameSet(selected, presets[preset])) ?? null
}

// picking a preset replaces the status selection; picking the active one clears it
export function togglePreset<S extends string>(
  selected: S[],
  presets: StatusPresetMap<S>,
  preset: StatusPreset,
): S[] {
  return activePreset(selected, presets) === preset ? [] : [...presets[preset]]
}
