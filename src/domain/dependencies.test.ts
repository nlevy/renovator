import { describe, expect, it } from 'vitest'
import { buildDependencyForest, type DepNode } from './dependencies'
import { task } from '../test/fixtures'

const titles = (nodes: DepNode[]): unknown =>
  nodes.map((n) => (n.children.length ? { [n.task.title]: titles(n.children) } : n.task.title))

describe('buildDependencyForest', () => {
  it('nests a chain with the top-level goal as the root', () => {
    const electric = task({ title: 'חשמל' })
    const drywall = task({ title: 'גבס', dependsOn: [electric.id] })
    const paint = task({ title: 'צבע', dependsOn: [drywall.id] })
    expect(titles(buildDependencyForest([electric, drywall, paint]))).toEqual([
      { צבע: [{ גבס: ['חשמל'] }] },
    ])
  })

  it('shows a shared prerequisite under each dependent root', () => {
    const demo = task({ title: 'הריסה' })
    const a = task({ title: 'ריצוף', dependsOn: [demo.id] })
    const b = task({ title: 'צנרת', dependsOn: [demo.id] })
    expect(titles(buildDependencyForest([demo, a, b]))).toEqual([
      { צנרת: ['הריסה'] },
      { ריצוף: ['הריסה'] },
    ])
  })

  it('collapses a shared intermediate sub-tree to a reference after its first appearance', () => {
    const countertop = task({ title: 'שיש' })
    const kitchen = task({ title: 'מטבח', dependsOn: [countertop.id] })
    const stove = task({ title: 'כיריים', dependsOn: [kitchen.id] })
    const fridge = task({ title: 'מקרר', dependsOn: [kitchen.id] })
    const forest = buildDependencyForest([countertop, kitchen, stove, fridge])

    // roots sorted he: כיריים then מקרר
    expect(forest.map((n) => n.task.title)).toEqual(['כיריים', 'מקרר'])
    // first root expands the kitchen sub-tree fully
    expect(titles([forest[0]])).toEqual([{ כיריים: [{ מטבח: ['שיש'] }] }])
    // second root shows kitchen as a collapsed reference, no repeated children
    const kitchenUnderFridge = forest[1].children[0]
    expect(kitchenUnderFridge.task.title).toBe('מטבח')
    expect(kitchenUnderFridge.reference).toBe(true)
    expect(kitchenUnderFridge.children).toEqual([])
  })

  it('omits tasks with no dependency relationships', () => {
    const lonely = task({ title: 'בודד' })
    const dep = task({ title: 'בסיס' })
    const top = task({ title: 'עליון', dependsOn: [dep.id] })
    expect(titles(buildDependencyForest([lonely, dep, top]))).toEqual([{ עליון: ['בסיס'] }])
  })

  it('stops at a cycle instead of recursing forever', () => {
    const a = task({ title: 'A' })
    const b = task({ title: 'B', dependsOn: [a.id] })
    a.dependsOn = [b.id]
    const forest = buildDependencyForest([a, b])
    // both are depended-on, so the fallback shows them as roots; recursion halts
    const flatten = (nodes: DepNode[]): boolean => nodes.some((n) => n.cyclic || flatten(n.children))
    expect(flatten(forest)).toBe(true)
  })

  it('ignores dangling dependency ids', () => {
    const top = task({ title: 'עליון', dependsOn: ['deleted-id'] })
    expect(buildDependencyForest([top])).toEqual([])
  })
})
