import { NavLink, Outlet } from 'react-router'
import { logout, useAuth } from '../auth/auth'

export default function AppLayout() {
  const user = useAuth()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-gray-200 bg-white md:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-gray-200 px-5">
          <img src="/logo.png" alt="" className="size-8" />
          <span className="font-semibold text-gray-900">Smart Hisaab HQ</span>
        </div>

        <nav className="flex-1 p-3">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                isActive ? 'bg-brand-50 text-brand-800' : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4.5">
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
            Dashboard
          </NavLink>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-6">
          <img src="/logo.png" alt="Smart Hisaab HQ" className="size-8 md:hidden" />
          <div className="ml-auto flex items-center gap-3">
            {user?.photoUrl ? (
              <img src={user.photoUrl} alt="" referrerPolicy="no-referrer" className="size-8 rounded-full" />
            ) : (
              <div className="flex size-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800">
                {user?.name[0]?.toUpperCase()}
              </div>
            )}
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Sign out
          </button>
        </header>

        <main className="flex-1 p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
