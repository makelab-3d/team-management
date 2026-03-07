import { useState, useRef, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import BottomNav from './BottomNav'

export default function AppShell() {
  const { employee, signOut } = useAuth()
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('makelab_dark_mode')
    return saved ? saved === 'true' : false
  })
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('makelab_dark_mode', String(darkMode))
  }, [darkMode])

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const initials = employee
    ? ((employee.full_name || employee.email || '?').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase())
    : '?'

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-col header-left">
          <img
            src="https://d3k81ch9hvuctc.cloudfront.net/company/SSAACi/images/629fa4cf-df38-4cb4-b46d-0aff3d6c9eed.png"
            alt="Makelab"
            className="header-logo"
          />
        </div>

        <div className="header-col header-center">
          <h1 className="header-app-name">Team Management</h1>
        </div>

        <div className="header-col header-right">
          <div
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className="theme-toggle-icon">☀</span>
            <div className="theme-toggle-track">
              <div className={`theme-toggle-thumb ${darkMode ? 'dark' : ''}`} />
            </div>
            <span className="theme-toggle-icon">☽</span>
          </div>

          <div className="avatar-group" ref={menuRef}>
            {employee?.avatar_url ? (
              <button className="avatar-btn" onClick={() => setShowMenu(!showMenu)}>
                <img src={employee.avatar_url} alt="" className="avatar-img" />
              </button>
            ) : (
              <button className="avatar-btn avatar-initials-btn" onClick={() => setShowMenu(!showMenu)}>
                {initials}
              </button>
            )}
            {showMenu && (
              <div className="avatar-menu">
                <button onClick={signOut} className="avatar-menu-item">Sign out</button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
