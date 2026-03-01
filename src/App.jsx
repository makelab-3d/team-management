import { HashRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AppShell from './components/layout/AppShell'
import TimeEntry from './pages/TimeEntry'
import History from './pages/History'
import Profile from './pages/Profile'
import AdminApproval from './pages/AdminApproval'

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route index element={<TimeEntry />} />
            <Route path="history" element={<History />} />
            <Route path="profile" element={<Profile />} />
            <Route path="admin" element={<AdminApproval />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
