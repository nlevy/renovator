import { describe, expect, it } from 'vitest'
import { activePreset, togglePreset, type StatusPresetMap } from './statusPresets'

type Status = 'a' | 'b' | 'c'

const presets: StatusPresetMap<Status> = { open: ['a', 'b'], closed: ['c'] }

describe('activePreset', () => {
  it('returns null when nothing is selected', () => {
    expect(activePreset([], presets)).toBeNull()
  })

  it('recognises a selection matching a preset regardless of order', () => {
    expect(activePreset(['b', 'a'], presets)).toBe('open')
    expect(activePreset(['c'], presets)).toBe('closed')
  })

  it('returns null for a custom selection', () => {
    expect(activePreset(['a'], presets)).toBeNull()
    expect(activePreset(['a', 'b', 'c'], presets)).toBeNull()
  })
})

describe('togglePreset', () => {
  it('selects the preset statuses', () => {
    expect(togglePreset([], presets, 'open')).toEqual(['a', 'b'])
  })

  it('clears the filter when the active preset is picked again', () => {
    expect(togglePreset(['a', 'b'], presets, 'open')).toEqual([])
  })

  it('replaces a custom selection', () => {
    expect(togglePreset(['a', 'c'], presets, 'closed')).toEqual(['c'])
  })

  it('switches from one preset to the other', () => {
    expect(togglePreset(['a', 'b'], presets, 'closed')).toEqual(['c'])
  })

  it('does not alias the preset array', () => {
    const result = togglePreset([], presets, 'open')
    result.push('c')
    expect(presets.open).toEqual(['a', 'b'])
  })
})
