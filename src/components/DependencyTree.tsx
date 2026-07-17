import { TaskStatusBadge } from './StatusBadge'
import type { DepNode } from '../domain/dependencies'

function NodeRow({ node, prefix }: { node: DepNode; prefix: string }) {
  if (node.reference) {
    return (
      <li className="flex items-center gap-1 text-sm text-slate-400">
        <span>↑ {node.task.title}</span>
        <span className="text-xs">· מוצג למעלה</span>
      </li>
    )
  }
  return (
    <li>
      <div className="flex items-center gap-2 text-sm">
        <TaskStatusBadge status={node.task.status} />
        <span>{node.task.title}</span>
        {node.cyclic && <span className="text-xs text-red-500">תלות מעגלית</span>}
      </div>
      {node.children.length > 0 && (
        <ul className="mt-1 space-y-1 border-s-2 border-slate-100 ps-3 ms-1">
          {node.children.map((child, i) => (
            <NodeRow key={`${prefix}-${i}`} node={child} prefix={`${prefix}-${i}`} />
          ))}
        </ul>
      )}
    </li>
  )
}

export default function DependencyTree({ nodes }: { nodes: DepNode[] }) {
  return (
    <ul className="space-y-2">
      {nodes.map((node, i) => (
        <NodeRow key={i} node={node} prefix={`${i}`} />
      ))}
    </ul>
  )
}
