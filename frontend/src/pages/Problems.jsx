import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProblems } from '../api/problems'
import { useAuth } from '../contexts/AuthContext'
import { Search, CheckCircle, ChevronLeft, ChevronRight, Filter } from 'lucide-react'

// ─── Difficulty badge ──────────────────────────────────────────────────────────
function DiffBadge({ difficulty }) {
  const map = { EASY: 'badge-easy', MEDIUM: 'badge-medium', HARD: 'badge-hard' }
  return (
    <span className={`badge ${map[difficulty?.toUpperCase()] || 'badge-pending'}`}>
      {difficulty ? difficulty.charAt(0) + difficulty.slice(1).toLowerCase() : '—'}
    </span>
  )
}

// ─── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr>
      {[40, 280, 100, 100, 200].map((w, i) => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <div className="skeleton" style={{ height: 16, width: w, borderRadius: 4 }} />
        </td>
      ))}
    </tr>
  )
}

const DIFFICULTIES = ['ALL', 'EASY', 'MEDIUM', 'HARD']
const PAGE_SIZE = 20

export default function Problems() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [problems, setProblems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Debounced search fetch
  const fetchProblems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, limit: PAGE_SIZE }
      if (search.trim()) params.search = search.trim()
      // API expects capitalized difficulty (Easy/Medium/Hard), not the uppercase UI value.
      if (difficulty !== 'ALL') params.difficulty = difficulty.charAt(0) + difficulty.slice(1).toLowerCase()

      const data = await getProblems(params)
      setProblems(data.problems ?? data ?? [])
      setTotal(data.pagination?.total ?? data.total ?? (data.problems ?? data ?? []).length)
    } catch (err) {
      setError('Failed to load problems. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [page, difficulty, search])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => fetchProblems(), 300)
    return () => clearTimeout(t)
  }, [search, page, difficulty, fetchProblems])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="page">
      <div className="container" style={{ paddingBottom: 64 }}>
        {/* ── Header ── */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', marginBottom: 8 }}>
            Problems
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
            {total > 0 ? `${total} problems available` : 'Browse and solve algorithmic challenges'}
          </p>
        </div>

        {/* ── Filters ── */}
        <div style={{
          display: 'flex', gap: 12, flexWrap: 'wrap',
          marginBottom: 24, alignItems: 'center',
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 280px', minWidth: 200 }}>
            <Search size={15} style={{
              position: 'absolute', left: 12, top: '50%',
              transform: 'translateY(-50%)', color: 'var(--text-muted)',
            }} />
            <input
              className="input"
              style={{ paddingLeft: 36 }}
              placeholder="Search problems..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>

          {/* Difficulty filter */}
          <div style={{ display: 'flex', gap: 6 }}>
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => { setDifficulty(d); setPage(1) }}
                className="btn btn-ghost"
                style={{
                  padding: '8px 14px',
                  fontSize: 13,
                  ...(difficulty === d ? {
                    background: 'rgba(22,101,52,0.15)',
                    borderColor: 'rgba(22,101,52,0.45)',
                    color: 'var(--brand-green)',
                  } : {}),
                }}
              >
                {d === 'ALL' ? 'All' : d.charAt(0) + d.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
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
                  <th style={{ width: 50 }}>#</th>
                  <th>Title</th>
                  <th>Difficulty</th>
                  <th>Acceptance</th>
                  <th>Tags</th>
                  {isAuthenticated && <th style={{ width: 60, textAlign: 'center' }}>Status</th>}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonRow key={i} />)
                  : problems.length === 0
                    ? (
                      <tr>
                        <td colSpan={isAuthenticated ? 6 : 5} style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
                          No problems found matching your filters.
                        </td>
                      </tr>
                    )
                    : problems.map((p, idx) => (
                      <tr
                        key={p.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/problems/${p.slug}`)}
                      >
                        <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                          {(page - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        <td>
                          <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                            {p.title}
                          </span>
                          {p.rating && (
                            <span style={{
                              marginLeft: 8, fontSize: 11,
                              color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
                            }}>
                              ★{p.rating}
                            </span>
                          )}
                        </td>
                        <td><DiffBadge difficulty={p.difficulty} /></td>
                        <td style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                          {p.acceptanceRate != null
                            ? `${Math.round(p.acceptanceRate)}%`
                            : '—'
                          }
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {(p.tags ?? []).slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                style={{
                                  background: 'rgba(255,255,255,0.05)',
                                  border: '1px solid var(--border)',
                                  borderRadius: 4,
                                  padding: '2px 7px',
                                  fontSize: 11,
                                  color: 'var(--text-muted)',
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                            {(p.tags ?? []).length > 3 && (
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                +{p.tags.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        {isAuthenticated && (
                          <td style={{ textAlign: 'center' }}>
                            {p.solved && <CheckCircle size={16} style={{ color: 'var(--accent-success)' }} />}
                          </td>
                        )}
                      </tr>
                    ))
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
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = i + 1
              return (
                <button
                  key={p}
                  className="btn btn-ghost"
                  style={{
                    padding: '8px 14px', minWidth: 40,
                    ...(page === p ? {
                      background: 'rgba(22,101,52,0.15)',
                      borderColor: 'rgba(22,101,52,0.45)',
                      color: 'var(--brand-green)',
                    } : {}),
                  }}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              )
            })}

            {totalPages > 7 && (
              <>
                <span style={{ color: 'var(--text-muted)' }}>…</span>
                <button
                  className="btn btn-ghost"
                  style={{ padding: '8px 14px' }}
                  onClick={() => setPage(totalPages)}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              className="btn btn-ghost"
              style={{ padding: '8px 12px' }}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
