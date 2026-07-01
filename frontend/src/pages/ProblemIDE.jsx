import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getProblem } from '../api/problems'
import { submitCode, getSubmissions } from '../api/submissions'
import { useAuth } from '../contexts/AuthContext'
import useSocket from '../hooks/useSocket'
import {
  Play, Send, RotateCcw, ChevronDown, Clock, Cpu,
  CheckCircle, XCircle, AlertTriangle, Loader, FileText,
  Terminal, List, Lightbulb
} from 'lucide-react'

// ─── Language configs ──────────────────────────────────────────────────────────
const LANGUAGES = [
  { id: 'python', label: 'Python 3', monaco: 'python', ext: '.py',
    starter: '# Write your solution here\n\ndef solution():\n    pass\n' },
  { id: 'javascript', label: 'JavaScript', monaco: 'javascript', ext: '.js',
    starter: '// Write your solution here\n\nfunction solution() {\n  \n}\n' },
  { id: 'java', label: 'Java', monaco: 'java', ext: '.java',
    starter: 'import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n' },
  { id: 'cpp', label: 'C++', monaco: 'cpp', ext: '.cpp',
    starter: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n' },
  { id: 'c', label: 'C', monaco: 'c', ext: '.c',
    starter: '#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n' },
]

// ─── Verdict display ───────────────────────────────────────────────────────────
const VERDICT_MAP = {
  ACCEPTED: { label: 'Accepted', icon: CheckCircle, color: '#10b981' },
  WRONG_ANSWER: { label: 'Wrong Answer', icon: XCircle, color: '#ef4444' },
  TIME_LIMIT_EXCEEDED: { label: 'Time Limit Exceeded', icon: Clock, color: '#f59e0b' },
  MEMORY_LIMIT_EXCEEDED: { label: 'Memory Limit Exceeded', icon: AlertTriangle, color: '#f97316' },
  RUNTIME_ERROR: { label: 'Runtime Error', icon: AlertTriangle, color: '#ec4899' },
  COMPILATION_ERROR: { label: 'Compilation Error', icon: XCircle, color: '#94a3b8' },
  PENDING: { label: 'Pending…', icon: Loader, color: '#94a3b8' },
  RUNNING: { label: 'Running…', icon: Loader, color: '#3b82f6' },
}

function VerdictDisplay({ verdict, runtime, memory, passedCases, totalCases }) {
  if (!verdict) return null
  const v = VERDICT_MAP[verdict] || VERDICT_MAP.PENDING
  const Icon = v.icon
  const isAnimated = verdict === 'PENDING' || verdict === 'RUNNING'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 16, padding: 20,
      animation: 'fadeIn 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Icon
          size={28}
          style={{ color: v.color, animation: isAnimated ? 'spin 1s linear infinite' : undefined }}
        />
        <span style={{ fontSize: 20, fontWeight: 700, color: v.color }}>{v.label}</span>
      </div>

      {!isAnimated && (
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {runtime != null && (
            <div style={{ fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>Runtime: </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{runtime}ms</span>
            </div>
          )}
          {memory != null && (
            <div style={{ fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>Memory: </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{memory}MB</span>
            </div>
          )}
          {passedCases != null && totalCases != null && (
            <div style={{ fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>Tests: </span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontWeight: 600,
                color: passedCases === totalCases ? '#10b981' : '#ef4444',
              }}>
                {passedCases}/{totalCases}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Difficulty badge ──────────────────────────────────────────────────────────
function DiffBadge({ difficulty }) {
  const map = { EASY: 'badge-easy', MEDIUM: 'badge-medium', HARD: 'badge-hard' }
  return (
    <span className={`badge ${map[difficulty] || 'badge-pending'}`}>
      {difficulty ? difficulty.charAt(0) + difficulty.slice(1).toLowerCase() : '—'}
    </span>
  )
}

// ─── Left Panel ───────────────────────────────────────────────────────────────
function ProblemPanel({ problem, submissions, submissionsLoading, activeTab, setActiveTab }) {
  if (!problem) return null

  const tabs = [
    { id: 'description', label: 'Description', icon: FileText },
    { id: 'submissions', label: 'Submissions', icon: List },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Problem header */}
      <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, lineHeight: 1.3 }}>
          {problem.title}
        </h1>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <DiffBadge difficulty={problem.difficulty} />
          {problem.rating && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>★ {problem.rating}</span>
          )}
          {(problem.tags ?? []).map((tag) => (
            <span key={tag} style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border)',
              borderRadius: 4, padding: '2px 8px',
              fontSize: 11, color: 'var(--text-muted)',
            }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-nav">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`tab-btn${activeTab === id ? ' active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {activeTab === 'description' && (
          <div>
            {/* Description */}
            <div style={{
              fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)',
              marginBottom: 24,
            }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {problem.description || '_No description provided._'}
              </ReactMarkdown>
            </div>

            {/* Examples */}
            {(problem.examples ?? problem.sampleCases ?? []).map((ex, i) => (
              <div key={i} style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Example {i + 1}
                </h3>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Input:</div>
                    <pre style={{ fontSize: 13, margin: 0 }}>{ex.input}</pre>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Output:</div>
                    <pre style={{ fontSize: 13, margin: 0 }}>{ex.output}</pre>
                  </div>
                  {ex.explanation && (
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Explanation:</div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>{ex.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Constraints */}
            {problem.constraints && (
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Constraints
                </h3>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {problem.constraints}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* Limits */}
            <div style={{
              marginTop: 24, padding: 16,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              display: 'flex', gap: 24, fontSize: 13,
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Time: </span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  {problem.timeLimit ?? 2000}ms
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Memory: </span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  {problem.memoryLimit ?? 256}MB
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'submissions' && (
          <div>
            {submissionsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton" style={{ height: 50, borderRadius: 8 }} />
                ))}
              </div>
            ) : submissions.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0' }}>
                No submissions yet. Submit your first solution!
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Verdict</th>
                    <th>Language</th>
                    <th>Runtime</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <span className={`verdict-${s.verdict}`} style={{ fontWeight: 600, fontSize: 13 }}>
                          {s.verdict?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{s.language}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                        {s.executionTime != null ? `${s.executionTime}ms` : '—'}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {new Date(s.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ProblemIDE() {
  const { slug } = useParams()
  const { isAuthenticated, user } = useAuth()
  const { socket } = useSocket()

  // Problem data
  const [problem, setProblem] = useState(null)
  const [problemLoading, setProblemLoading] = useState(true)
  const [problemError, setProblemError] = useState(null)

  // Editor state
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0])
  const [code, setCode] = useState(LANGUAGES[0].starter)
  const [editorTheme, setEditorTheme] = useState('vs-dark')

  // Panel tabs
  const [leftTab, setLeftTab] = useState('description')
  const [rightTab, setRightTab] = useState('testcases')
  const [customInput, setCustomInput] = useState('')

  // Submission state
  const [submitting, setSubmitting] = useState(false)
  const [verdict, setVerdict] = useState(null)
  const [resultData, setResultData] = useState(null)

  // Submissions history
  const [submissions, setSubmissions] = useState([])
  const [submissionsLoading, setSubmissionsLoading] = useState(false)

  // Track per-language code
  const codeMap = useRef({})

  // Load problem
  useEffect(() => {
    setProblemLoading(true)
    setProblemError(null)
    getProblem(slug)
      .then((p) => {
        const actualProblem = p.problem || p;
        setProblem(actualProblem)
        // Pre-fill custom input with first example
        const firstEx = (actualProblem.examples ?? actualProblem.sampleCases ?? [])[0]
        if (firstEx) setCustomInput(firstEx.input)
      })
      .catch(() => setProblemError('Failed to load problem.'))
      .finally(() => setProblemLoading(false))
  }, [slug])

  // Load submissions
  const loadSubmissions = useCallback(() => {
    if (!problem || !isAuthenticated) return
    setSubmissionsLoading(true)
    getSubmissions({ problemId: problem.id, limit: 10 })
      .then((d) => setSubmissions(d.submissions ?? d ?? []))
      .catch(() => setSubmissions([]))
      .finally(() => setSubmissionsLoading(false))
  }, [problem, isAuthenticated])

  useEffect(() => { loadSubmissions() }, [loadSubmissions])

  // Listen for real-time verdict updates
  useEffect(() => {
    if (!socket) return
    const handler = (data) => {
      if (data.submissionId) {
        setVerdict(data.verdict)
        setResultData(data)
        setSubmitting(false)
        if (data.verdict === 'ACCEPTED' || data.verdict === 'WRONG_ANSWER') {
          loadSubmissions()
        }
      }
    }
    socket.on('submission-result', handler)
    return () => socket.off('submission-result', handler)
  }, [socket, loadSubmissions])

  // Handle language change
  const handleLangChange = (langId) => {
    // Save current code
    codeMap.current[selectedLang.id] = code
    const lang = LANGUAGES.find((l) => l.id === langId)
    if (!lang) return
    setSelectedLang(lang)
    // Restore or use starter
    setCode(codeMap.current[langId] ?? lang.starter)
  }

  // Handle submit
  const handleSubmit = async () => {
    if (!isAuthenticated) {
      alert('Please login to submit.')
      return
    }
    if (!problem) return
    setSubmitting(true)
    setRightTab('result')
    setVerdict('PENDING')
    setResultData(null)

    try {
      const sub = await submitCode({
        problemId: problem.id,
        language: selectedLang.id,
        code,
      })
      // If server returns verdict immediately (sync mode)
      if (sub.verdict && sub.verdict !== 'PENDING') {
        setVerdict(sub.verdict)
        setResultData(sub)
        setSubmitting(false)
        loadSubmissions()
      }
      // Otherwise wait for socket update
    } catch (err) {
      setVerdict('RUNTIME_ERROR')
      setResultData({ error: err.response?.data?.message || 'Submission failed.' })
      setSubmitting(false)
    }
  }

  // Reset code
  const handleReset = () => {
    if (window.confirm('Reset code to starter template?')) {
      codeMap.current[selectedLang.id] = undefined
      setCode(selectedLang.starter)
    }
  }

  if (problemLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: 'calc(100vh - 60px)', marginTop: 60,
      }}>
        <div className="loading-spinner" style={{ width: 40, height: 40 }} />
      </div>
    )
  }

  if (problemError) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: 'calc(100vh - 60px)', marginTop: 60, color: 'var(--accent-danger)',
      }}>
        {problemError}
      </div>
    )
  }

  const sampleCases = problem?.examples ?? problem?.sampleCases ?? []

  return (
    <div className="split-pane" style={{ marginTop: 60 }}>
      {/* ── Left: Problem Description ── */}
      <div className="split-pane-left">
        <ProblemPanel
          problem={problem}
          submissions={submissions}
          submissionsLoading={submissionsLoading}
          activeTab={leftTab}
          setActiveTab={setLeftTab}
        />
      </div>

      {/* ── Right: Editor + Results ── */}
      <div className="split-pane-right">
        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          flexShrink: 0,
        }}>
          {/* Language selector */}
          <select
            className="input"
            style={{ width: 150 }}
            value={selectedLang.id}
            onChange={(e) => handleLangChange(e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </select>

          {/* Theme toggle */}
          <button
            className="btn btn-ghost"
            style={{ padding: '7px 12px', fontSize: 12 }}
            onClick={() => setEditorTheme((t) => t === 'vs-dark' ? 'light' : 'vs-dark')}
          >
            {editorTheme === 'vs-dark' ? '☀️ Light' : '🌙 Dark'}
          </button>

          {/* Reset */}
          <button
            className="btn btn-ghost"
            style={{ padding: '7px 12px', fontSize: 12 }}
            onClick={handleReset}
          >
            <RotateCcw size={13} /> Reset
          </button>

          <div style={{ flex: 1 }} />

          {/* Action buttons */}
          <button
            className="btn btn-ghost"
            style={{ padding: '8px 16px', fontSize: 13 }}
            onClick={() => setRightTab('result')}
            disabled={submitting}
          >
            <Play size={14} style={{ color: 'var(--accent-success)' }} /> Run
          </button>
          <button
            className="btn btn-success"
            style={{ padding: '8px 20px', fontSize: 13 }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Judging…</>
              : <><Send size={14} /> Submit</>
            }
          </button>
        </div>

        {/* Monaco Editor */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Editor
            height="100%"
            language={selectedLang.monaco}
            value={code}
            onChange={(v) => setCode(v ?? '')}
            theme={editorTheme}
            options={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontLigatures: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              lineNumbersMinChars: 3,
              padding: { top: 16, bottom: 16 },
              renderLineHighlight: 'gutter',
              cursorBlinking: 'smooth',
              smoothScrolling: true,
              tabSize: 4,
            }}
          />
        </div>

        {/* Bottom panel */}
        <div style={{
          height: 220, borderTop: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          background: 'var(--bg-secondary)', flexShrink: 0,
        }}>
          {/* Tab bar */}
          <div className="tab-nav" style={{ padding: '0 16px' }}>
            <button
              className={`tab-btn${rightTab === 'testcases' ? ' active' : ''}`}
              onClick={() => setRightTab('testcases')}
            >
              <Terminal size={12} style={{ marginRight: 4 }} /> Test Cases
            </button>
            <button
              className={`tab-btn${rightTab === 'result' ? ' active' : ''}`}
              onClick={() => setRightTab('result')}
            >
              <CheckCircle size={12} style={{ marginRight: 4 }} /> Result
            </button>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
            {rightTab === 'testcases' && (
              <div style={{ display: 'flex', gap: 16, height: '100%' }}>
                {/* Sample cases */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Sample Cases
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {sampleCases.slice(0, 2).map((tc, i) => (
                      <div
                        key={i}
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          borderRadius: 6, padding: '8px 12px',
                          fontSize: 12, fontFamily: 'var(--font-mono)',
                          cursor: 'pointer',
                        }}
                        onClick={() => setCustomInput(tc.input)}
                      >
                        <span style={{ color: 'var(--text-muted)' }}>Case {i + 1}: </span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {tc.input.slice(0, 40)}{tc.input.length > 40 ? '…' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom input */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Custom Input
                  </div>
                  <textarea
                    className="input"
                    style={{
                      flex: 1, resize: 'none',
                      fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.6,
                    }}
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Enter custom test input..."
                    spellCheck={false}
                  />
                </div>
              </div>
            )}

            {rightTab === 'result' && (
              <div>
                {verdict ? (
                  <VerdictDisplay
                    verdict={verdict}
                    runtime={resultData?.executionTime}
                    memory={resultData?.memoryUsed}
                    passedCases={resultData?.passedCases}
                    totalCases={resultData?.totalCases}
                  />
                ) : (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    height: 140, color: 'var(--text-muted)', fontSize: 14,
                    flexDirection: 'column', gap: 8,
                  }}>
                    <Send size={24} style={{ opacity: 0.3 }} />
                    Submit your code to see results here
                  </div>
                )}

                {resultData?.compileOutput && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Compiler Output:</div>
                    <pre style={{ fontSize: 12, color: 'var(--accent-danger)', maxHeight: 80, overflow: 'auto' }}>
                      {resultData.compileOutput}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
