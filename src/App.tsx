import { Navigate, Route, Routes } from 'react-router'
import { logout, useAuth } from './auth/auth'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'

export default function App() {
  const user = useAuth()

  if (user === undefined) return <main className="flex min-h-screen items-center justify-center">Loading...</main>

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  if (!user.role) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3">
        <p>{user.email} does not have access to HQ.</p>
        <button className="rounded border px-4 py-2 hover:bg-gray-50" onClick={logout}>
          Sign out
        </button>
      </main>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
