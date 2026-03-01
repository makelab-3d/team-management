import { useAuth } from '../../context/AuthContext'
import LoginPage from './LoginPage'

export default function ProtectedRoute({ children }) {
  const { user, employee, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    )
  }

  if (!user) return <LoginPage />

  if (!employee) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">MAKELAB</div>
          <h2>Account Not Found</h2>
          <p className="text-muted">
            Your email is not linked to an employee profile. Contact your admin to get set up.
          </p>
        </div>
      </div>
    )
  }

  return children
}
