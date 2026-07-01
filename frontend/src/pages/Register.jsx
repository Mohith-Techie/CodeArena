import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, getRank } from '../contexts/AuthContext'
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'

// ─── Rank color map ────────────────────────────────────────────────────────────
const RANK_COLORS = {
  Newbie: '#94a3b8', Pupil: '#10b981', Specialist: '#06b6d4',
  Expert: '#3b82f6', 'Candidate Master': '#8b5cf6', Master: '#f97316', Grandmaster: '#ef4444',
}

// ─── Password strength ─────────────────────────────────────────────────────────
function getStrength(password) {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return score // 0–4
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']
const STRENGTH_COLORS = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981']

function PasswordStrength({ password }) {
  if (!password) return null
  const s = getStrength(password)
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i <= s ? STRENGTH_COLORS[s] : 'var(--border)',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 11, color: STRENGTH_COLORS[s] }}>
        {STRENGTH_LABELS[s]}
      </span>
    </div>
  )
}

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Preview rank based on starting rating (1000 = Newbie always)
  const previewRank = 'Newbie'
  const previewColor = RANK_COLORS[previewRank]

  const passwordMatch = confirm === '' || password === confirm

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (getStrength(password) < 2) {
      setError('Password is too weak. Add uppercase letters and numbers.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await register(username.trim(), email.trim(), password)
      navigate('/')
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Registration failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at bottom right, rgba(16,185,129,0.08) 0%, transparent 50%), radial-gradient(ellipse at top left, rgba(124,58,237,0.12) 0%, transparent 50%), var(--bg-primary)',
      padding: '80px 24px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⚔️</div>
            <div style={{
              fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px',
              background: 'linear-gradient(135deg, #fff, var(--accent-light), var(--accent-cyan))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              CodeArena
            </div>
          </Link>
          <p style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 14 }}>
            Join 180,000+ competitive programmers
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: 32,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Create account</h2>
            {/* Rank preview */}
            {username && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: `${previewColor}18`,
                border: `1px solid ${previewColor}40`,
                borderRadius: 99, padding: '4px 12px',
                fontSize: 12, fontWeight: 600, color: previewColor,
                animation: 'fadeIn 0.3s ease',
              }}>
                ⚡ {previewRank}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 'var(--radius-md)', padding: '10px 14px',
              color: 'var(--accent-danger)', fontSize: 13, marginBottom: 20,
            }}>
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Username */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>
                Username
              </label>
              <input
                className="input"
                type="text"
                placeholder="yourhandle"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={30}
                pattern="[a-zA-Z0-9_-]+"
                title="Letters, numbers, underscores and hyphens only"
                autoFocus
                autoComplete="username"
              />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Letters, numbers, _ and - only
              </p>
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>
                Email address
              </label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', padding: 2,
                  }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>
                Confirm password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Repeat password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  style={{
                    paddingRight: 44,
                    borderColor: !passwordMatch ? 'var(--accent-danger)' : undefined,
                  }}
                />
                {confirm && (
                  <div style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)',
                  }}>
                    {passwordMatch
                      ? <CheckCircle size={15} style={{ color: 'var(--accent-success)' }} />
                      : <AlertCircle size={15} style={{ color: 'var(--accent-danger)' }} />
                    }
                  </div>
                )}
              </div>
              {!passwordMatch && (
                <p style={{ fontSize: 11, color: 'var(--accent-danger)', marginTop: 4 }}>
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading || !passwordMatch}
              style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 8 }}
            >
              {loading ? (
                <><div className="loading-spinner" style={{ width: 16, height: 16 }} /> Creating account…</>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent-light)', fontWeight: 500, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
