import { useRef, type ReactNode } from 'react'
import { parseImport } from '../data/importExport'
import { useStore } from '../store/useStore'

interface Props {
  className?: string
  children: ReactNode
  // ask before replacing when there is existing data to lose
  confirmReplace?: boolean
  onImported?: () => void
}

export default function ImportButton({ className, children, confirmReplace = true, onImported }: Props) {
  const replaceAll = useStore((s) => s.replaceAll)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    try {
      const data = parseImport(await file.text())
      if (confirmReplace) {
        const summary = `${data.tasks.length} משימות, ${data.purchases.length} רכישות, ${data.contacts.length} אנשי קשר`
        if (!window.confirm(`הייבוא יחליף את כל הנתונים הקיימים (${summary}). להמשיך?`)) return
      }
      replaceAll(data)
      onImported?.()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'הייבוא נכשל')
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={() => inputRef.current?.click()}>
        {children}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
          e.target.value = ''
        }}
      />
    </>
  )
}
