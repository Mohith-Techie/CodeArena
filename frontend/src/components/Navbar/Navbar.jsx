import React, { useState, useEffect, useRef } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth, getRank } from '../../contexts/AuthContext'
import {
  Code2, Trophy, Users, BarChart2, LogOut, User,
  ChevronDown, Menu, X, Swords, Settings
} from 'lucide-react'
import './Navbar.css'

// ─── Rank color map ────────────────────────────────────────────────────────────
const RANK_COLORS = {
  Newbie: '#94a3b8',
  Pupil: '#10b981',
  Specialist: '#06b6d4',
  Expert: '#3b82f6',
  'Candidate Master': '#8b5cf6',
  Master: '#f97316',
  Grandmaster: '#ef4444',
}

// ─── Nav items ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: '/problems', label: 'Problems', icon: Code2 },
  { to: '/contests', label: 'Contests', icon: Trophy },
  { to: '/leaderboard', label: 'Leaderboard', icon: BarChart2 },
]

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Scroll effect — add glass blur when user scrolls down
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close mobile menu on resize
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setMobileOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const handleLogout = async () => {
    setUserMenuOpen(false)
    await logout()
    navigate('/')
  }

  const rank = user ? getRank(user.rating) : null
  const rankColor = rank ? RANK_COLORS[rank] : undefined
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'U'

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="navbar-inner">

          {/* ── Logo ── */}
          <Link to="/" className="navbar-logo" onClick={() => setMobileOpen(false)}>
            <span className="navbar-logo-text">CodeArena</span>
          </Link>

          {/* ── Center Links ── */}
          <div className="navbar-links">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
              >
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </div>

          {/* ── Right Side ── */}
          <div className="navbar-right">
            {isAuthenticated && user ? (
              /* User menu */
              <div className="navbar-user dropdown" ref={dropdownRef}>
                <button
                  className="navbar-user-trigger"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  aria-expanded={userMenuOpen}
                >
                  <div className="navbar-avatar">{initials}</div>
                  <span className="navbar-username" style={{ color: rankColor }}>
                    {user.username}
                  </span>
                  <span className="navbar-rating">{user.rating ?? 0}</span>
                  <ChevronDown
                    size={14}
                    className={`navbar-chevron${userMenuOpen ? ' open' : ''}`}
                  />
                </button>

                {userMenuOpen && (
                  <div className="dropdown-menu">
                    {/* Rank label */}
                    <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                        Signed in as
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: rankColor }}>
                        {rank} • {user.rating ?? 0}
                      </div>
                    </div>

                    <Link
                      to={`/profile/${user.username}`}
                      className="dropdown-item"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User size={14} /> Profile
                    </Link>

                    <div className="dropdown-separator" />

                    <button className="dropdown-item" onClick={handleLogout}>
                      <LogOut size={14} />
                      <span style={{ color: 'var(--accent-danger)' }}>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Auth buttons */
              <>
                <Link to="/login" className="btn btn-ghost navbar-auth-btn">
                  Log in
                </Link>
                <Link to="/register" className="btn btn-primary navbar-auth-btn">
                  Get Started
                </Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              className="navbar-hamburger"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <div className="navbar-mobile-menu">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `navbar-mobile-link${isActive ? ' active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}

          {!isAuthenticated && (
            <>
              <div className="navbar-mobile-divider" />
              <Link
                to="/login"
                className="navbar-mobile-link"
                onClick={() => setMobileOpen(false)}
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="navbar-mobile-link"
                style={{ color: 'var(--accent-light)' }}
                onClick={() => setMobileOpen(false)}
              >
                Create account
              </Link>
            </>
          )}

          {isAuthenticated && user && (
            <>
              <div className="navbar-mobile-divider" />
              <Link
                to={`/profile/${user.username}`}
                className="navbar-mobile-link"
                onClick={() => setMobileOpen(false)}
              >
                <User size={16} /> Profile
              </Link>
              <button
                className="navbar-mobile-link"
                style={{ color: 'var(--accent-danger)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'left' }}
                onClick={handleLogout}
              >
                <LogOut size={16} /> Logout
              </button>
            </>
          )}
        </div>
      )}
    </>
  )
}
