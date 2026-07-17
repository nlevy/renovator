import type { Task } from './schemas'

export interface DepNode {
  task: Task
  children: DepNode[]
  // true when the task was already visited on this branch (a dependency cycle),
  // so we stop recursing to avoid an infinite tree
  cyclic?: boolean
  // true when this task's sub-tree was already shown at an earlier occurrence,
  // so it is collapsed here to a reference instead of repeating the whole branch
  reference?: boolean
}

// Builds a forest of dependency chains. Each root is a task that nothing else
// depends on (a top-level goal); its children are the tasks it depends on,
// recursively. Tasks not involved in any dependency are omitted.
export function buildDependencyForest(tasks: Task[]): DepNode[] {
  const byId = new Map(tasks.map((t) => [t.id, t]))
  const validDeps = (task: Task) => task.dependsOn.filter((id) => byId.has(id))

  const dependedOn = new Set<string>()
  for (const task of tasks) for (const id of validDeps(task)) dependedOn.add(id)

  const participates = (task: Task) => validDeps(task).length > 0 || dependedOn.has(task.id)

  // tasks whose sub-tree has already been rendered once; a later occurrence of a
  // task that has its own dependencies collapses to a reference
  const expanded = new Set<string>()

  const build = (task: Task, ancestors: Set<string>): DepNode => {
    if (ancestors.has(task.id)) return { task, children: [], cyclic: true }
    const deps = validDeps(task)
    if (deps.length > 0 && expanded.has(task.id)) return { task, children: [], reference: true }
    expanded.add(task.id)
    const nextAncestors = new Set(ancestors).add(task.id)
    const children = deps.map((id) => build(byId.get(id)!, nextAncestors))
    return { task, children }
  }

  const participating = tasks.filter(participates)
  let roots = participating.filter((t) => !dependedOn.has(t.id))
  // pure cycle with no clear top: fall back to showing every involved task
  if (roots.length === 0) roots = participating
  return roots
    .sort((a, b) => a.title.localeCompare(b.title, 'he'))
    .map((task) => build(task, new Set()))
}
