import { NavLink, Outlet } from 'react-router-dom'
import AccountMenu from '../auth/AccountMenu'

const navItems = [
  { to: '/', label: 'לוח בקרה' },
  { to: '/tasks', label: 'משימות' },
  { to: '/purchases', label: 'רכישות' },
  { to: '/budget', label: 'תקציב' },
  { to: '/timeline', label: 'ציר זמן' },
  { to: '/contacts', label: 'אנשי קשר' },
  { to: '/settings', label: 'הגדרות' },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 pt-4">
          <h1 className="text-xl font-bold text-teal-700">🏠 מנהל השיפוץ</h1>
          <AccountMenu />
        </div>
        <nav className="mx-auto max-w-5xl overflow-x-auto px-4">
          <ul className="flex gap-1 whitespace-nowrap py-2">
            {navItems.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-1.5 text-sm font-medium ${
                      isActive ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
