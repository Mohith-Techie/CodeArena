import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getLeaderboard } from '../api/users'
import { useAuth } from '../contexts/AuthContext'
import { ChevronLeft, ChevronRight, Crown, TrendingUp } from 'lucide-react'

// ─── Rank helpers ──────────────────────────────────────────────────────────────
function getRankColor(rating = 0) {
  if (rating < 1200) return '#94a3b8'
  if (rating < 1400) return '#10b981'
  if (rating < 1600) return '#06b6d4'
  if (rating < 1900) return '#3b82f6'
  if (rating < 2100) return '#8b5cf6'
  if (rating < 2400) return '#f97316'
  return '#ef4444'
}
function getRankName(rating = 0) {
  if (rating < 1200) return 'Newbie'
  if (rating < 1400) return 'Pupil'
  if (rating < 1600) return 'Specialist'
  if (rating < 1900) return 'Expert'
  if (rating < 2100) return 'Candidate Master'
  if (rating < 2400) return 'Master'
  return 'Grandmaster'
}

// ─── Rank position display ─────────────────────────────────────────────────────
function RankCell({ position }) {
  if (position === 1) return <span style={{ fontSize: 20 }}>🥇</span>
  if (position === 2) return <span style={{ fontSize: 20 }}>🥈</span>
  if (position === 3) return <span style={{ fontSize: 20 }}>🥉</span>
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 13,
      fontWeight: 600, color: 'var(--text-muted)',
    }}>
      #{position}
    </span>
  )
}

// ─── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr>
      {[40, 200, 120, 120, 120, 120].map((w, i) => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <div className="skeleton" style={{ height: 16, width: w, borderRadius: 4 }} />
        </td>
      ))}
    </tr>
  )
}

const PAGE_SIZE = 50

export default function Leaderboard() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getLeaderboard(page, PAGE_SIZE)
      setUsers(data.users ?? data ?? [])
      setTotal(data.total ?? (data.users ?? data ?? []).length)
    } catch {
      setError('Failed to load leaderboard.')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchData() }, [fetchData])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="page">
      <div className="container" style={{ paddingBottom: 64 }}>
        {/* ── Header ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <Crown size={28} style={{ color: 'var(--accent-warning)' }} />
            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px' }}>Leaderboard</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
            Global rankings by Codeforces-style rating
          </p>
        </div>

        {/* ── Platform stats strip ── */}
        <div style={{
          display: 'flex', gap: 24, marginBottom: 32, flexWrap: 'wrap',
        }}>
          {[
            { label: 'Total Competitors', value: total > 0 ? total.toLocaleString() : '180,000+' },
            { label: 'Grandmasters', value: '42' },
            { label: 'Masters', value: '310' },
            { label: 'Active Today', value: '4,820' },
          ].map((s) => (
            <div key={s.label} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '12px 20px',
              flex: '1 1 140px',
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {s.value}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Table ── */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}>
          {error ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--accent-danger)' }}>
              {error}
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 60, textAlign: 'center' }}>Rank</th>
                  <th>User</th>
                  <th>Rating</th>
                  <th>Max Rating</th>
                  <th>Solved</th>
                  <th>Contests</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 20 }).map((_, i) => <SkeletonRow key={i} />)
                  : users.map((u, idx) => {
                      const globalPos = (page - 1) * PAGE_SIZE + idx + 1
                      const isMe = user && (u.id === user.id || u.username === user.username)
                      const color = getRankColor(u.rating)
                      return (
                        <tr
                          key={u.id}
                          style={{
                            background: isMe ? 'rgba(124,58,237,0.06)' : undefined,
                          }}
                        >
                          <td style={{ textAlign: 'center' }}>
                            <RankCell position={globalPos} />
                          </td>
                          <td>
                            <Link
                              to={`/profile/${u.username}`}
                              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}
                            >
                              {/* Mini avatar */}
                              <div style={{
                                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                                background: `linear-gradient(135deg, ${color}80, var(--accent))`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 11, fontWeight: 700, color: 'white',
                              }}>
                                {u.username.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color, fontSize: 14 }}>
                                  {u.username}
                                  {isMe && (
                                    <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--accent-light)', fontWeight: 500 }}>
                                      (you)
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                  {getRankName(u.rating)}
                                </div>
                              </div>
                            </Link>
                          </td>
                          <td>
                            <span style={{
                              fontFamily: 'var(--font-mono)', fontWeight: 700,
                              fontSize: 15, color,
                            }}>
                              {u.rating ?? 0}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-secondary)' }}>
                            {u.maxRating ?? u.rating ?? 0}
                          </td>
                          <td style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                            {u.problemsSolved ?? 0}
                          </td>
                          <td style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                            {u.contestsParticipated ?? 0}
                          </td>
                        </tr>
                      )
                    })
                }
              </tbody>
            </table>
          )}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, marginTop: 24,
          }}>
            <button
              className="btn btn-ghost"
              style={{ padding: '8px 12px' }}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <span style={{ fontSize: 14, color: 'var(--text-muted)', padding: '0 12px' }}>
              Page {page} of {totalPages}
            </span>
            <button
              className="btn btn-ghost"
              style={{ padding: '8px 12px' }}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
