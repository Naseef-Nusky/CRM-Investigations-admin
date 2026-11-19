import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const STAFF = ['SUPER_ADMIN', 'MANAGEMENT', 'OFFICE_ADMIN', 'ACCOUNTS']

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        Loading…
      </div>
    )
  }

  if (!user || !STAFF.includes(user.role)) {
    return <Navigate to="/login" replace />
  }

  return children
}
