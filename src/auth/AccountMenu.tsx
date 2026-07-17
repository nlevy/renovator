import { useAuth } from './useAuth'

export default function AccountMenu() {
  const { user, loading, configured, signIn, signOutUser } = useAuth()

  // guest-only build (no Firebase config) — hide the control entirely
  if (!configured) return null
  if (loading) return <span className="text-sm text-slate-400">…</span>

  if (!user) {
    return (
      <button
        onClick={signIn}
        className="rounded-md border border-teal-600 px-3 py-1 text-sm font-medium text-teal-700 hover:bg-teal-50"
      >
        התחברות
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="max-w-40 truncate text-slate-600" title={user.email ?? undefined}>
        {user.displayName || user.email}
      </span>
      <button
        onClick={signOutUser}
        className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100"
      >
        התנתקות
      </button>
    </div>
  )
}
