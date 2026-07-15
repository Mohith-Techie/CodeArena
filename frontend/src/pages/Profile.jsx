import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getUserProfile } from '../api/users'
import { getSubmissions } from '../api/submissions'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import { MapPin, Calendar, TrendingUp, Code2, Trophy } from 'lucide-react'

// ─── Rank color ────────────────────────────────────────────────────────────────
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

// ─── Circular progress ─────────────────────────────────────────────────────────
function CircleProgress({ value, max, color, label, sublabel }) {
  const r = 36
  const circ = 2 * Math.PI * r
  const pct = max > 0 ? Math.min(value / max, 1) : 0
  const dash = circ * pct

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width={88} height={88} viewBox="0 0 88 88">
        <circle cx={44} cy={44} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={7} />
        <circle
          cx={44} cy={44} r={r}
          fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 44 44)"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x={44} y={44} textAnchor="middle" dy="0.35em"
          style={{ fill: color, fontSize: 18, fontWeight: 800, fontFamily: 'Inter, sans-serif' }}>
          {value}
        </text>
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sublabel}</div>
      </div>
    </div>
  )
}

// ─── Submission Heatmap (simplified) ──────────────────────────────────────────
function Heatmap({ submissions }) {
  // Build a day → count map for past 52 weeks
  const counts = {}
  submissions.forEach((s) => {
    const d = new Date(s.createdAt).toISOString().slice(0, 10)
    counts[d] = (counts[d] || 0) + 1
  })

  const cells = []
  const now = new Date()
  for (let w = 51; w >= 0; w--) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(now)
      date.setDate(now.getDate() - w * 7 - d)
      const key = date.toISOString().slice(0, 10)
      const count = counts[key] || 0
      cells.push({ key, count })
    }
  }

  const maxCount = Math.max(1, ...Object.values(counts))

  const getColor = (count) => {
    if (count === 0) return 'rgba(255,255,255,0.04)'
    const intensity = Math.min(count / maxCount, 1)
    const alpha = 0.2 + intensity * 0.8
    return `rgba(225, 29, 72, ${alpha})`
  }

  return (
    <div>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)' }}>
        Submission Activity
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(52, 12px)',
        gridTemplateRows: 'repeat(7, 12px)',
        gap: 2,
        overflowX: 'auto',
      }}>
        {cells.map(({ key, count }) => (
          <div
            key={key}
            title={`${key}: ${count} submission${count !== 1 ? 's' : ''}`}
            style={{
              width: 12, height: 12,
              borderRadius: 2,
              background: getColor(count),
              cursor: 'default',
              transition: 'background 0.2s',
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Rating chart tooltip ──────────────────────────────────────────────────────
function RatingTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '10px 14px', fontSize: 13,
    }}>
      <div style={{ fontWeight: 700, color: 'var(--accent-light)' }}>{d.rating}</div>
      {d.contest && <div style={{ color: 'var(--text-muted)' }}>{d.contest}</div>}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Profile() {
  const { username } = useParams()
  const [profile, setProfile] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getUserProfile(username),
      getSubmissions({ username, limit: 200 }),
    ])
      .then(([prof, subs]) => {
        setProfile(prof)
        setSubmissions(subs.submissions ?? subs ?? [])
      })
      .catch(() => setError('User not found.'))
      .finally(() => setLoading(false))
  }, [username])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <div className="loading-spinner" style={{ width: 40, height: 40 }} />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', color: 'var(--accent-danger)' }}>
        {error}
      </div>
    )
  }

  const rating = profile.rating ?? 0
  const maxRating = profile.maxRating ?? rating
  const rankColor = getRankColor(rating)
  const rankName = getRankName(rating)

  // Build rating history for chart (use ratingHistory or simulate)
  const ratingHistory = (profile.ratingHistory ?? []).length > 0
    ? profile.ratingHistory
    : [{ rating: 1000 }, { rating }]

  // Difficulty breakdown
  const diff = {
    easy: profile.solvedByDifficulty?.EASY ?? 0,
    medium: profile.solvedByDifficulty?.MEDIUM ?? 0,
    hard: profile.solvedByDifficulty?.HARD ?? 0,
  }
  const totalSolved = profile.problemsSolved ?? (diff.easy + diff.medium + diff.hard)

  const recentSubs = submissions.slice(0, 10)

  return (
    <div className="page">
      <div className="container" style={{ paddingBottom: 80 }}>

        {/* ── Profile Header ── */}
        <div style={{
          background: `linear-gradient(135deg, ${rankColor}18, rgba(16,185,129,0.04))`,
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative orb */}
          <div style={{
            position: 'absolute', top: -60, right: -60,
            width: 200, height: 200,
            background: `radial-gradient(circle, ${rankColor}30, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{
              width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${rankColor}, #7c3aed)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 800, color: 'white',
              border: `3px solid ${rankColor}60`,
              boxShadow: `0 0 24px ${rankColor}40`,
            }}>
              {username.slice(0, 2).toUpperCase()}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: rankColor }}>
                  {profile.username}
                </h1>
                <span style={{
                  background: `${rankColor}25`, border: `1px solid ${rankColor}50`,
                  borderRadius: 99, padding: '3px 12px',
                  fontSize: 13, fontWeight: 700, color: rankColor,
                }}>
                  {rankName}
                </span>
              </div>

              {profile.bio && (
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 12, maxWidth: 500 }}>
                  {profile.bio}
                </p>
              )}

              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-muted)' }}>
                {profile.country && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <MapPin size={13} /> {profile.country}
                  </span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Calendar size={13} />
                  Joined {new Date(profile.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Rating badge */}
            <div style={{
              textAlign: 'center', padding: '16px 24px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 'var(--radius-lg)',
            }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: rankColor, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                {rating}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Rating
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                Max: <span style={{ color: rankColor, fontWeight: 600 }}>{maxRating}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Problems Solved', value: totalSolved, icon: Code2, color: 'var(--accent-success)' },
            { label: 'Contests', value: profile.contestsParticipated ?? 0, icon: Trophy, color: 'var(--accent-warning)' },
            { label: 'Current Rating', value: rating, icon: TrendingUp, color: rankColor },
            { label: 'Max Rating', value: maxRating, icon: TrendingUp, color: 'var(--accent-light)' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div className="stat-value" style={{ color }}>{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          {/* ── Rating Graph ── */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: 24,
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Rating History</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={ratingHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="contest" tick={{ fontSize: 10, fill: '#475569' }} hide />
                <YAxis tick={{ fontSize: 11, fill: '#475569' }} domain={['auto', 'auto']} />
                <Tooltip content={<RatingTooltip />} />
                <Line
                  type="monotone" dataKey="rating"
                  stroke={rankColor} strokeWidth={2}
                  dot={{ fill: rankColor, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* ── Difficulty Breakdown ── */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: 24,
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Problems Solved</h3>
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
              <CircleProgress value={diff.easy} max={Math.max(diff.easy, 500)} color="#10b981" label="Easy" sublabel={`/ ~500`} />
              <CircleProgress value={diff.medium} max={Math.max(diff.medium, 1200)} color="#f59e0b" label="Medium" sublabel={`/ ~1200`} />
              <CircleProgress value={diff.hard} max={Math.max(diff.hard, 600)} color="#ef4444" label="Hard" sublabel={`/ ~600`} />
            </div>
          </div>
        </div>

        {/* ── Heatmap ── */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 24,
          overflowX: 'auto',
        }}>
          <Heatmap submissions={submissions} />
        </div>

        {/* ── Recent Submissions ── */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Recent Submissions</h3>
          </div>
          {recentSubs.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              No submissions yet.
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Problem</th>
                  <th>Verdict</th>
                  <th>Language</th>
                  <th>Runtime</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {recentSubs.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <Link
                        to={`/problems/${s.problem?.slug ?? s.problemId}`}
                        style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}
                      >
                        {s.problem?.title ?? s.problemId}
                      </Link>
                    </td>
                    <td>
                      <span className={`verdict-${s.verdict}`} style={{ fontSize: 13, fontWeight: 600 }}>
                        {s.verdict?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{s.language}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                      {s.executionTime != null ? `${s.executionTime}ms` : '—'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
