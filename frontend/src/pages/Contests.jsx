import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getContests, registerForContest } from '../api/contests'
import { useAuth } from '../contexts/AuthContext'
import { Trophy, Clock, Users, Calendar, ArrowRight, Zap } from 'lucide-react'

// ─── Countdown timer ───────────────────────────────────────────────────────────
function Countdown({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const compute = () => {
      const diff = new Date(targetDate) - new Date()
      if (diff <= 0) { setTimeLeft('Started'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${h}h ${m}m ${s}s`)
    }
    compute()
    const t = setInterval(compute, 1000)
    return () => clearInterval(t)
  }, [targetDate])

  return <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-warning)' }}>{timeLeft}</span>
}

// ─── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    UPCOMING: { label: 'Upcoming', bg: 'rgba(100,116,139,0.15)', color: '#94a3b8' },
    LIVE: { label: '● Live Now', bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
    PAST: { label: 'Ended', bg: 'rgba(71,85,105,0.15)', color: '#475569' },
  }
  const s = map[status] || map.PAST
  return (
    <span style={{
      background: s.bg, color: s.color,
      border: `1px solid ${s.color}40`,
      borderRadius: 99, padding: '3px 10px',
      fontSize: 12, fontWeight: 600,
    }}>
      {s.label}
    </span>
  )
}

// ─── Contest Card ──────────────────────────────────────────────────────────────
function ContestCard({ contest, onRegister, registering }) {
  const { isAuthenticated } = useAuth()
  const start = new Date(contest.startTime)
  const end = new Date(contest.endTime)
  const durationH = Math.round((end - start) / 3600000)

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      transition: 'border-color 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(225,29,72,0.35)'
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(225,29,72,0.12)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3, flex: 1 }}>
          {contest.title}
        </h3>
        <StatusBadge status={contest.status} />
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
          <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
          {start.toLocaleDateString()} · {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={13} style={{ color: 'var(--text-muted)' }} />
            {durationH}h duration
          </span>
          {contest._count && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={13} style={{ color: 'var(--text-muted)' }} />
              {contest._count.registrations} registered
            </span>
          )}
          {contest._count?.problems != null && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              📋 {contest._count.problems} problems
            </span>
          )}
        </div>

        {/* Countdown for upcoming */}
        {contest.status === 'UPCOMING' && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Starts in: <Countdown targetDate={contest.startTime} />
          </div>
        )}
      </div>

      {/* Action */}
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        {contest.status === 'LIVE' && (
          <Link
            to={`/contests/${contest.id}`}
            className="btn btn-success"
            style={{ flex: 1, justifyContent: 'center', padding: '9px 16px', fontSize: 13 }}
          >
            <Zap size={14} /> Enter Contest
          </Link>
        )}
        {contest.status === 'UPCOMING' && isAuthenticated && (
          <button
            className="btn btn-primary"
            style={{ flex: 1, justifyContent: 'center', padding: '9px 16px', fontSize: 13 }}
            onClick={() => onRegister(contest.id)}
            disabled={registering === contest.id || contest.isRegistered}
          >
            {contest.isRegistered ? '✓ Registered' : registering === contest.id ? 'Registering…' : 'Register'}
          </button>
        )}
        {contest.status === 'UPCOMING' && !isAuthenticated && (
          <Link
            to="/login"
            className="btn btn-ghost"
            style={{ flex: 1, justifyContent: 'center', padding: '9px 16px', fontSize: 13 }}
          >
            Login to register
          </Link>
        )}
        {contest.status === 'PAST' && (
          <Link
            to={`/contests/${contest.id}`}
            className="btn btn-ghost"
            style={{ flex: 1, justifyContent: 'center', padding: '9px 16px', fontSize: 13 }}
          >
            View Results
          </Link>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
const TABS = ['ALL', 'UPCOMING', 'LIVE', 'PAST']

export default function Contests() {
  const [contests, setContests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('ALL')
  const [registering, setRegistering] = useState(null)

  const fetchContests = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = activeTab !== 'ALL' ? { status: activeTab } : {}
      const data = await getContests(params)
      setContests(data.contests ?? data ?? [])
    } catch {
      setError('Failed to load contests.')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => { fetchContests() }, [fetchContests])

  const handleRegister = async (contestId) => {
    setRegistering(contestId)
    try {
      await registerForContest(contestId)
      setContests((prev) =>
        prev.map((c) => c.id === contestId ? { ...c, isRegistered: true } : c)
      )
    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed.')
    } finally {
      setRegistering(null)
    }
  }

  const liveCount = contests.filter((c) => c.status === 'LIVE').length

  return (
    <div className="page">
      <div className="container" style={{ paddingBottom: 64 }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px' }}>Contests</h1>
            {liveCount > 0 && (
              <span style={{
                background: 'rgba(16,185,129,0.15)', color: '#10b981',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 99, padding: '4px 12px',
                fontSize: 12, fontWeight: 600,
                animation: 'pulse 2s infinite',
              }}>
                {liveCount} Live
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
            Compete in rated contests and climb the global leaderboard
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none', border: 'none',
                borderBottom: `2px solid ${activeTab === tab ? 'var(--accent-light)' : 'transparent'}`,
                color: activeTab === tab ? 'var(--accent-light)' : 'var(--text-secondary)',
                cursor: 'pointer', fontFamily: 'var(--font-sans)',
                fontSize: 14, fontWeight: 500, padding: '10px 16px',
                marginBottom: -1, transition: 'color 0.2s, border-color 0.2s',
              }}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ color: 'var(--accent-danger)', textAlign: 'center', padding: '48px 0' }}>
            {error}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton" style={{ height: 180, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ) : contests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
            <Trophy size={40} style={{ marginBottom: 16, opacity: 0.3 }} />
            <p>No {activeTab !== 'ALL' ? activeTab.toLowerCase() : ''} contests found.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {contests.map((c) => (
              <ContestCard
                key={c.id}
                contest={c}
                onRegister={handleRegister}
                registering={registering}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
