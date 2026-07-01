import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getContests } from '../api/contests'
import { getLeaderboard } from '../api/users'
import { ArrowRight, Zap, Shield, Trophy, Code2, Users, CheckCircle, TrendingUp } from 'lucide-react'

// ─── Rank color helper ─────────────────────────────────────────────────────────
const RANK_COLORS = {
  Newbie: '#94a3b8', Pupil: '#10b981', Specialist: '#06b6d4',
  Expert: '#3b82f6', 'Candidate Master': '#8b5cf6', Master: '#f97316', Grandmaster: '#ef4444',
}
function getRankColor(rating = 0) {
  if (rating < 1200) return RANK_COLORS.Newbie
  if (rating < 1400) return RANK_COLORS.Pupil
  if (rating < 1600) return RANK_COLORS.Specialist
  if (rating < 1900) return RANK_COLORS.Expert
  if (rating < 2100) return RANK_COLORS['Candidate Master']
  if (rating < 2400) return RANK_COLORS.Master
  return RANK_COLORS.Grandmaster
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

// ─── Static platform stats ─────────────────────────────────────────────────────
const STATS = [
  { label: 'Problems', value: '2,400+', color: 'var(--accent-light)' },
  { label: 'Active Users', value: '180K+', color: 'var(--accent-success)' },
  { label: 'Submissions', value: '12M+', color: 'var(--accent-cyan)' },
  { label: 'Contests', value: '850+', color: 'var(--accent-warning)' },
]

// ─── Feature cards ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Shield,
    title: 'Isolated Sandboxes',
    desc: 'Every submission runs in a hardened Docker container with strict CPU, memory, and time limits. Your code never touches the host system.',
    color: 'var(--accent-success)',
  },
  {
    icon: TrendingUp,
    title: 'Codeforces-style Ratings',
    desc: 'Compete in rated contests and watch your rating rise. Climb from Newbie to Grandmaster through head-to-head competition.',
    color: 'var(--accent-light)',
  },
  {
    icon: Zap,
    title: 'Real-time Judgement',
    desc: 'Get verdicts in milliseconds via WebSockets. Watch your submission status update live — no page refreshes needed.',
    color: 'var(--accent-cyan)',
  },
]

// ─── Contest status badge ──────────────────────────────────────────────────────
function ContestStatusBadge({ status }) {
  const map = {
    UPCOMING: { label: 'Upcoming', cls: 'badge-pending' },
    LIVE: { label: '● Live', cls: 'badge-running' },
    PAST: { label: 'Ended', cls: 'badge-pending' },
  }
  const s = map[status] || map.PAST
  return <span className={`badge ${s.cls}`}>{s.label}</span>
}

// ─── Contest card ──────────────────────────────────────────────────────────────
function ContestCard({ contest }) {
  const start = new Date(contest.startTime)
  return (
    <Link to={`/contests/${contest.id}`} style={{ textDecoration: 'none' }}>
      <div className="glass-card" style={{ padding: 20, cursor: 'pointer' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
            {contest.title}
          </h3>
          <ContestStatusBadge status={contest.status} />
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
          <span>🗓 {start.toLocaleDateString()}</span>
          <span>⏱ {Math.round((new Date(contest.endTime) - start) / 3600000)}h</span>
          {contest._count && <span>👥 {contest._count.registrations} registered</span>}
        </div>
      </div>
    </Link>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Home() {
  const { isAuthenticated } = useAuth()
  const [contests, setContests] = useState([])
  const [topUsers, setTopUsers] = useState([])
  const [loadingContests, setLoadingContests] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)

  useEffect(() => {
    // Fetch recent contests
    getContests({ limit: 3 })
      .then((data) => setContests(data.contests ?? data ?? []))
      .catch(() => setContests([]))
      .finally(() => setLoadingContests(false))

    // Fetch top users
    getLeaderboard(1, 5)
      .then((data) => setTopUsers(data.users ?? data ?? []))
      .catch(() => setTopUsers([]))
      .finally(() => setLoadingUsers(false))
  }, [])

  return (
    <div>
      {/* ── Hero ── */}
      <section
        className="gradient-bg"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          paddingTop: 60,
        }}
      >
        {/* Decorative orbs */}
        <div style={{
          position: 'absolute', top: '20%', left: '10%',
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '20%', right: '5%',
          width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />

        <div className="container" style={{ position: 'relative', textAlign: 'center', padding: '80px 24px' }}>
          {/* Tag line */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: 99, padding: '6px 16px', marginBottom: 32,
            fontSize: 13, color: 'var(--accent-light)', fontWeight: 500,
          }}>
            <Zap size={14} />
            Next-generation competitive programming
          </div>

          <h1 style={{
            fontSize: 'clamp(40px, 8vw, 80px)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-2px',
            marginBottom: 24,
          }}>
            <span className="gradient-text">Compete.</span>{' '}
            <span className="gradient-text">Code.</span>{' '}
            <span className="gradient-text">Conquer.</span>
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 2vw, 20px)',
            color: 'var(--text-secondary)',
            maxWidth: 560,
            margin: '0 auto 40px',
            lineHeight: 1.7,
          }}>
            Sharpen your algorithms, compete in live rated contests, and climb
            the global leaderboard. Over 2,400 problems await.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/problems" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: 15 }}>
              Start Solving <ArrowRight size={16} />
            </Link>
            <Link to="/contests" className="btn btn-ghost" style={{ padding: '14px 28px', fontSize: 15 }}>
              <Trophy size={16} /> View Contests
            </Link>
          </div>

          {/* Floating code snippet */}
          <div style={{
            marginTop: 60,
            display: 'inline-block',
            textAlign: 'left',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            lineHeight: 1.8,
            maxWidth: 420,
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            animation: 'float 4s ease-in-out infinite',
          }}>
            <div style={{ color: '#94a3b8', marginBottom: 4 }}>{'// Two Sum — O(n) solution'}</div>
            <div><span style={{ color: '#8b5cf6' }}>def</span>{' '}<span style={{ color: '#06b6d4' }}>twoSum</span>(nums, target):</div>
            <div style={{ paddingLeft: 20 }}>seen = {'{}'}</div>
            <div style={{ paddingLeft: 20 }}><span style={{ color: '#8b5cf6' }}>for</span> i, n <span style={{ color: '#8b5cf6' }}>in</span> <span style={{ color: '#10b981' }}>enumerate</span>(nums):</div>
            <div style={{ paddingLeft: 40 }}>comp = target - n</div>
            <div style={{ paddingLeft: 40 }}><span style={{ color: '#8b5cf6' }}>if</span> comp <span style={{ color: '#8b5cf6' }}>in</span> seen:</div>
            <div style={{ paddingLeft: 60 }}><span style={{ color: '#8b5cf6' }}>return</span> [seen[comp], i]</div>
            <div style={{ paddingLeft: 40 }}>seen[n] = i</div>
            <div style={{ marginTop: 8, color: '#10b981' }}>✓ Accepted — 42ms · 16.4MB</div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '48px 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 24 }}>
            {STATS.map((s) => (
              <div key={s.label} className="stat-card">
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: '96px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: 16 }}>
              Built for <span className="gradient-text">Serious Competitors</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 480, margin: '0 auto' }}>
              Everything you need to practice, compete, and improve — all in one place.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="glass-card" style={{ padding: 32 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 'var(--radius-md)',
                  background: `${color}20`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', marginBottom: 20,
                }}>
                  <Icon size={22} style={{ color }} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recent Contests ── */}
      <section style={{ padding: '0 0 96px', background: 'var(--bg-secondary)', paddingTop: 64 }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <h2 style={{ fontSize: 26, fontWeight: 700 }}>Recent Contests</h2>
            <Link to="/contests" className="btn btn-ghost" style={{ fontSize: 13 }}>
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {loadingContests ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-lg)' }} />
              ))}
            </div>
          ) : contests.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {contests.slice(0, 3).map((c) => <ContestCard key={c.id} contest={c} />)}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0' }}>
              No contests found. Check back soon!
            </div>
          )}
        </div>
      </section>

      {/* ── Top Users ── */}
      <section style={{ padding: '64px 0 96px' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <h2 style={{ fontSize: 26, fontWeight: 700 }}>Top Competitors</h2>
            <Link to="/leaderboard" className="btn btn-ghost" style={{ fontSize: 13 }}>
              Full leaderboard <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loadingUsers
              ? [1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="skeleton" style={{ height: 60, borderRadius: 'var(--radius-md)' }} />
                ))
              : topUsers.slice(0, 5).map((u, idx) => (
                  <Link key={u.id} to={`/profile/${u.username}`} style={{ textDecoration: 'none' }}>
                    <div className="glass-card" style={{
                      padding: '14px 20px',
                      display: 'flex', alignItems: 'center', gap: 16,
                    }}>
                      {/* Rank medal */}
                      <div style={{ width: 32, textAlign: 'center', fontSize: 18, flexShrink: 0 }}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : (
                          <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>
                            #{idx + 1}
                          </span>
                        )}
                      </div>
                      {/* Avatar */}
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: `linear-gradient(135deg, ${getRankColor(u.rating)}, var(--accent))`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0,
                      }}>
                        {u.username.slice(0, 2).toUpperCase()}
                      </div>
                      {/* Username */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: getRankColor(u.rating), fontSize: 14 }}>
                          {u.username}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {getRankName(u.rating)}
                        </div>
                      </div>
                      {/* Rating */}
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: getRankColor(u.rating) }}>
                        {u.rating ?? 0}
                      </div>
                    </div>
                  </Link>
                ))
            }
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      {!isAuthenticated && (
        <section style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(16,185,129,0.08))',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          padding: '64px 0',
          textAlign: 'center',
        }}>
          <div className="container">
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, marginBottom: 16 }}>
              Ready to climb the rankings?
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 32 }}>
              Join 180,000+ developers competing on CodeArena. It's free forever.
            </p>
            <Link to="/register" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: 15 }}>
              Create Free Account <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '32px 0',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: 13,
      }}>
        <div className="container">
          <span>⚔️ CodeArena © {new Date().getFullYear()} — Compete. Code. Conquer.</span>
        </div>
      </footer>
    </div>
  )
}
