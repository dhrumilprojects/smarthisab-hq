import { Outlet } from 'react-router'
import { logout, useAuth } from '../../auth/auth'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'
import Sidebar from './Sidebar'

export default function AppLayout() {
  const user = useAuth()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-6">
          <img src="/logo.png" alt="Smart Hisaab HQ" className="size-8 md:hidden" />
          <div className="ml-auto flex items-center gap-3">
            {user && <Avatar name={user.name} photoUrl={user.photoUrl} />}
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <Button onClick={logout}>Sign out</Button>
        </header>

        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
