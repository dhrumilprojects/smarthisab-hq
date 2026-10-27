import { Navigate, Route, Routes } from 'react-router'
import { logout, useAuth } from './auth/auth'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'

export default function App() {
  const user = useAuth()

  if (user === undefined) return <main className="center">Loading...</main>

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
      <main className="center">
        <p>{user.email} does not have access to HQ.</p>
        <button onClick={logout}>Sign out</button>
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
