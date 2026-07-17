import { useEffect, useRef, useState, type ReactNode } from 'react'
import { db } from '../auth/firebase'
import { useAuth } from '../auth/useAuth'
import type { AppData } from '../domain/schemas'
import { CloudAdapter } from './adapters/CloudAdapter'
import { LocalAdapter } from './adapters/LocalAdapter'
import { initSync } from './sync'

type Access = 'guest' | 'connecting' | 'cloud' | 'denied'

function hasContent(data: AppData): boolean {
  return data.tasks.length > 0 || data.purchases.length > 0 || data.contacts.length > 0
}

function isPermissionDenied(e: unknown): boolean {
  return (e as { code?: string })?.code === 'permission-denied'
}

/**
 * Bridges auth state to the storage layer. `main.tsx` has already started guest
 * (local) sync before first paint; this switches to the cloud adapter when an
 * allow-listed user signs in, and back to local on sign-out. A signed-in user
 * who is not on the board's allowlist is denied by the security rules and shown
 * the no-access screen.
 */
export default function SyncManager({ children }: { children: ReactNode }) {
  const { user, loading, signOutUser } = useAuth()
  const [access, setAccess] = useState<Access>('guest')
  const mode = useRef<'local' | 'cloud'>('local') // main.tsx bootstrapped local

  useEffect(() => {
    if (loading) return
    let cancelled = false

    async function run() {
      if (user && db) {
        setAccess('connecting')
        const cloud = new CloudAdapter(db)
        try {
          const cloudData = await cloud.load()
          if (cancelled) return
          if (cloudData === null) {
            // shared board is empty — offer to seed it from local data
            const local = await new LocalAdapter().load()
            if (
              local &&
              hasContent(local) &&
              window.confirm('הלוח המשותף ריק. להעלות אליו את הנתונים המקומיים שלכם?')
            ) {
              await cloud.save(local)
            }
          }
          await initSync(cloud)
          if (cancelled) return
          mode.current = 'cloud'
          setAccess('cloud')
        } catch (e) {
          if (cancelled) return
          if (isPermissionDenied(e)) {
            setAccess('denied') // local sync keeps running underneath
          } else {
            console.error('cloud sync failed', e)
            setAccess('guest')
          }
        }
      } else {
        // guest (signed out / not configured)
        if (mode.current === 'cloud') {
          await initSync(new LocalAdapter())
          if (cancelled) return
          mode.current = 'local'
        }
        setAccess('guest')
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [user, loading])

  if (access === 'denied') {
    return <NoAccess email={user?.email ?? ''} onLeave={signOutUser} />
  }

  return (
    <>
      {children}
      {access === 'connecting' && (
        <div className="fixed bottom-3 left-3 z-50 rounded-md bg-slate-800 px-3 py-1.5 text-sm text-white shadow-lg">
          מתחבר לענן…
        </div>
      )}
    </>
  )
}

function NoAccess({ email, onLeave }: { email: string; onLeave: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md rounded-lg bg-white p-6 text-center shadow-sm">
        <h1 className="mb-2 text-lg font-bold text-teal-700">🏠 מנהל השיפוץ</h1>
        <p className="mb-1 text-slate-700">אין לחשבון הזה גישה ללוח המשותף.</p>
        <p className="mb-4 text-sm text-slate-500">
          {email && <span className="font-medium">{email}</span>} — בקשו מבעל הלוח להוסיף את הכתובת
          לרשימת המורשים.
        </p>
        <button
          onClick={onLeave}
          className="rounded-md bg-teal-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-700"
        >
          המשך כאורח
        </button>
      </div>
    </div>
  )
}
