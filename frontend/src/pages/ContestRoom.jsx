import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { getContest, getContestStandings } from '../api/contests'
import { submitCode } from '../api/submissions'
import { useAuth } from '../contexts/AuthContext'
import useSocket from '../hooks/useSocket'
import {
  Clock, Trophy, Loader, Send, CheckCircle, XCircle,
  AlertTriangle, Snowflake, Code2
} from 'lucide-react'

// ─── Language configs (same as ProblemIDE) ─────────────────────────────────────
const LANGUAGES = [
  { id: 'python', label: 'Python 3', monaco: 'python', starter: '# Write your solution\n' },
  { id: 'javascript', label: 'JavaScript', monaco: 'javascript', starter: '// Write your solution\n' },
  { id: 'java', label: 'Java', monaco: 'java', starter: 'import java.util.*;\npublic class Solution {\n    public static void main(String[] args) {\n    }\n}\n' },
  { id: 'cpp', label: 'C++', monaco: 'cpp', starter: '#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    return 0;\n}\n' },
  { id: 'c', label: 'C', monaco: 'c', starter: '#include <stdio.h>\nint main() {\n    return 0;\n}\n' },
]

// ─── Rank color helper ─────────────────────────────────────────────────────────
function getRankColor(rating = 0) {
  if (rating < 1200) return '#94a3b8'
  if (rating < 1400) return '#10b981'
  if (rating < 1600) return '#06b6d4'
  if (rating < 1900) return '#3b82f6'
  if (rating < 2100) return '#8b5cf6'
  if (rating < 2400) return '#f97316'
  return '#ef4444'
}

// ─── Countdown ─────────────────────────────────────────────────────────────────
function Countdown({ endTime, label = 'Time remaining' }) {
  const [left, setLeft] = useState('')
  const [isFreeze, setIsFreeze] = useState(false)

  useEffect(() => {
    const compute = () => {
      const diff = new Date(endTime) - new Date()
      if (diff <= 0) { setLeft('Contest ended'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
      // Freeze period: last 60 minutes
      setIsFreeze(diff < 3600000)
    }
    compute()
    const t = setInterval(compute, 1000)
    return () => clearInterval(t)
  }, [endTime])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {isFreeze && <Snowflake size={14} style={{ color: '#06b6d4' }} />}
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{
        fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16,
        color: isFreeze ? '#06b6d4' : 'var(--accent-warning)',
      }}>
        {left}
      </span>
    </div>
  )
}

// ─── Problem pill ──────────────────────────────────────────────────────────────
function ProblemPill({ label, problem, selected, solved, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: selected ? 'rgba(124,58,237,0.15)' : solved ? 'rgba(16,185,129,0.08)' : 'var(--bg-card)',
        border: `1px solid ${selected ? 'rgba(124,58,237,0.5)' : solved ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px',
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.15s',
        display: 'flex', alignItems: 'center', gap: 10,
        fontFamily: 'var(--font-sans)',
      }}
    >
      <span style={{
        fontWeight: 800, fontSize: 15,
        color: selected ? 'var(--accent-light)' : solved ? 'var(--accent-success)' : 'var(--text-secondary)',
        width: 18,
      }}>
        {label}
      </span>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {problem?.title ?? '—'}
      </span>
      {solved && <CheckCircle size={13} style={{ color: 'var(--accent-success)', flexShrink: 0 }} />}
    </button>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ContestRoom() {
  const { id } = useParams()
  const { user } = useAuth()
  const { socket } = useSocket()
  const navigate = useNavigate()

  const [contest, setContest] = useState(null)
  const [standings, setStandings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProbIdx, setSelectedProbIdx] = useState(0)
  const [lang, setLang] = useState(LANGUAGES[0])
  const [code, setCode] = useState(LANGUAGES[0].starter)
  const codeMap = useRef({})
  const [verdict, setVerdict] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [solvedSet, setSolvedSet] = useState(new Set())
  const [myRank, setMyRank] = useState(null)

  // Load contest data
  useEffect(() => {
    Promise.all([getContest(id), getContestStandings(id)])
      .then(([contestData, standData]) => {
        setContest(contestData)
        const rows = standData.standings ?? standData ?? []
        setStandings(rows)
        // Find my rank
        if (user) {
          const idx = rows.findIndex((r) => r.userId === user.id || r.username === user.username)
          if (idx >= 0) setMyRank(idx + 1)
        }
      })
      .catch(() => navigate('/contests'))
      .finally(() => setLoading(false))
  }, [id])

  // Real-time standings updates
  useEffect(() => {
    if (!socket) return
    socket.emit('contest:join', { contestId: id })
    socket.on('contest:standings', (data) => {
      setStandings(data.standings ?? data)
    })
    socket.on('submission:update', (data) => {
      if (data.verdict) {
        setVerdict(data.verdict)
        setSubmitting(false)
        if (data.verdict === 'ACCEPTED') {
          setSolvedSet((prev) => new Set([...prev, data.problemId]))
        }
      }
    })
    return () => {
      socket.emit('contest:leave', { contestId: id })
      socket.off('contest:standings')
      socket.off('submission:update')
    }
  }, [socket, id])

  const handleLangChange = (langId) => {
    const prob = contest?.problems?.[selectedProbIdx]
    const key = `${selectedProbIdx}-${lang.id}`
    codeMap.current[key] = code
    const newLang = LANGUAGES.find((l) => l.id === langId)
    setLang(newLang)
    setCode(codeMap.current[`${selectedProbIdx}-${langId}`] ?? newLang.starter)
  }

  const handleProblemSelect = (idx) => {
    const key = `${selectedProbIdx}-${lang.id}`
    codeMap.current[key] = code
    setSelectedProbIdx(idx)
    setCode(codeMap.current[`${idx}-${lang.id}`] ?? lang.starter)
    setVerdict(null)
  }

  const handleSubmit = async () => {
    const problem = contest?.problems?.[selectedProbIdx]
    if (!problem) return
    setSubmitting(true)
    setVerdict('PENDING')
    try {
      await submitCode({
        problemId: problem.id,
        language: lang.id,
        code,
        contestId: id,
      })
    } catch {
      setVerdict('RUNTIME_ERROR')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="loading-spinner" style={{ width: 40, height: 40 }} />
      </div>
    )
  }

  const problems = contest?.problems ?? []
  const currentProblem = problems[selectedProbIdx]
  const LABELS = 'ABCDEFGHIJ'

  const verdictColor = {
    ACCEPTED: '#10b981', WRONG_ANSWER: '#ef4444',
    TIME_LIMIT_EXCEEDED: '#f59e0b', PENDING: '#94a3b8', RUNNING: '#3b82f6',
  }[verdict] || '#94a3b8'

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', paddingTop: 60, overflow: 'hidden' }}>
      {/* ── Top bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '10px 20px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
        flexShrink: 0,
        flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {contest?.title}
          </h2>
        </div>
        {myRank && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <Trophy size={14} style={{ color: 'var(--accent-warning)' }} />
            <span style={{ color: 'var(--text-muted)' }}>Your rank:</span>
            <span style={{ fontWeight: 700, color: 'var(--accent-warning)' }}>#{myRank}</span>
          </div>
        )}
        {contest?.endTime && <Countdown endTime={contest.endTime} />}
      </div>

      {/* ── Main layout ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* ── Problem Sidebar ── */}
        <div style={{
          width: 220, borderRight: '1px solid var(--border)',
          background: 'var(--bg-secondary)', padding: 12,
          display: 'flex', flexDirection: 'column', gap: 4,
          overflowY: 'auto', flexShrink: 0,
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 4px 8px', fontWeight: 600 }}>
            Problems
          </div>
          {problems.map((p, i) => (
            <ProblemPill
              key={p.id}
              label={LABELS[i]}
              problem={p}
              selected={selectedProbIdx === i}
              solved={solvedSet.has(p.id)}
              onClick={() => handleProblemSelect(i)}
            />
          ))}
        </div>

        {/* ── Editor Area ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Toolbar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 16px', borderBottom: '1px solid var(--border)',
            background: 'var(--bg-card)', flexShrink: 0,
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-light)' }}>
              {LABELS[selectedProbIdx]}. {currentProblem?.title}
            </span>
            <div style={{ flex: 1 }} />

            {/* Verdict chip */}
            {verdict && (
              <span style={{
                background: `${verdictColor}20`, color: verdictColor,
                border: `1px solid ${verdictColor}40`,
                borderRadius: 99, padding: '3px 12px', fontSize: 12, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6,
                animation: verdict === 'PENDING' || verdict === 'RUNNING' ? 'pulse 1.5s infinite' : undefined,
              }}>
                {(verdict === 'PENDING' || verdict === 'RUNNING') && (
                  <Loader size={11} style={{ animation: 'spin 1s linear infinite' }} />
                )}
                {verdict.replace(/_/g, ' ')}
              </span>
            )}

            <select
              className="input"
              style={{ width: 130 }}
              value={lang.id}
              onChange={(e) => handleLangChange(e.target.value)}
            >
              {LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>

            <button
              className="btn btn-success"
              style={{ padding: '7px 18px', fontSize: 13 }}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting
                ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Judging</>
                : <><Send size={13} /> Submit</>
              }
            </button>
          </div>

          {/* Monaco editor */}
          <div style={{ flex: 1 }}>
            <Editor
              height="100%"
              language={lang.monaco}
              value={code}
              onChange={(v) => setCode(v ?? '')}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
              }}
            />
          </div>
        </div>

        {/* ── Mini Standings ── */}
        <div style={{
          width: 260, borderLeft: '1px solid var(--border)',
          background: 'var(--bg-secondary)', display: 'flex',
          flexDirection: 'column', flexShrink: 0, overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              🏆 Standings
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {standings.slice(0, 20).map((row, idx) => {
              const isMe = user && (row.userId === user.id || row.username === user.username)
              return (
                <div
                  key={row.userId || idx}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    background: isMe ? 'rgba(124,58,237,0.08)' : undefined,
                  }}
                >
                  <span style={{ width: 24, fontSize: 13, fontWeight: 700, color: idx < 3 ? '#f59e0b' : 'var(--text-muted)', textAlign: 'center' }}>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                  </span>
                  <span style={{
                    flex: 1, fontSize: 13, fontWeight: isMe ? 700 : 500,
                    color: isMe ? 'var(--accent-light)' : getRankColor(row.rating),
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {row.username}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {row.score ?? 0}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {row.penalty != null ? `+${row.penalty}` : ''}
                  </span>
                </div>
              )
            })}
            {standings.length === 0 && (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No submissions yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
