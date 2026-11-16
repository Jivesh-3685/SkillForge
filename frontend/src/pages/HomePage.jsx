import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import AuthModal from '../components/AuthModal'

const API_URL = import.meta.env.VITE_API_URL || ''

function StatusDot({ ok, label }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`h-2 w-2 rounded-full ${
          ok === null
            ? 'bg-gray-400 animate-pulse'
            : ok
              ? 'bg-emerald-400'
              : 'bg-rose-500'
        }`}
      />
      <span className="text-xs text-inherit">{label}</span>
      <span className="ml-auto text-[10px] font-mono opacity-60">
        {ok === null ? 'checking…' : ok ? 'ok' : 'offline'}
      </span>
    </div>
  )
}

export default function HomePage({ onNavigate }) {
  const { currentUser, userProfile } = useAuth()
  const { theme } = useTheme()
  const [prompt, setPrompt] = useState('')
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        setError(null)
        const res = await fetch(`${API_URL}/api/health`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setHealth(data)
      } catch (err) {
        setError(err.message)
        setHealth(null)
      }
    }
    checkHealth()
  }, [])

  const handlePromptSubmit = (e) => {
    e.preventDefault()
    if (!prompt.trim()) return
    // Navigate to AI mentor with the prompt in sessionStorage
    try {
      sessionStorage.setItem('sf_initial_prompt', prompt.trim())
    } catch {}
    onNavigate('mentor')
  }

  const quickPills = [
    { id: 'skills', icon: '⚡', label: 'Analyze Skills', desc: 'Scan code & score' },
    { id: 'gaps', icon: '🎯', label: 'Career Gaps', desc: 'Target shortfall' },
    { id: 'roadmap', icon: '🗺️', label: 'AI Roadmap', desc: 'Personal plan' },
    { id: 'resume', icon: '📄', label: 'Resume Match', desc: 'Audit claims' },
    { id: 'projects', icon: '💻', label: 'Projects', desc: 'Hands-on practice' },
    { id: 'mentor', icon: '🤖', label: 'Ask Mentor', desc: 'Chat coach' },
  ]

  const integrations = [
    { name: 'GitHub', icon: '🐙', color: 'text-white' },
    { name: 'FastAPI', icon: '⚡', color: 'text-teal-400' },
    { name: 'React', icon: '⚛️', color: 'text-cyan-400' },
    { name: 'MongoDB', icon: '🍃', color: 'text-emerald-400' },
    { name: 'Gemini AI', icon: '✨', color: 'text-amber-400' },
  ]

  return (
    <div className="space-y-10 max-w-4xl mx-auto py-4">
      {/* Notion AI Hero Section */}
      <div className="flex flex-col items-center text-center space-y-6 pt-6">
        {/* Animated Brand Mascot Avatar */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-[2px] shadow-2xl shadow-emerald-500/20">
            <div className={`w-full h-full ${theme.card} rounded-[22px] flex items-center justify-center text-3xl select-none`}>
              🤠
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#161b22] flex items-center justify-center text-white text-[10px]">
            ⚡
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2 max-w-xl">
          <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${theme.text}`}>
            {currentUser
              ? `What can I forge for ya, ${userProfile?.display_name?.split(' ')[0] || currentUser.displayName?.split(' ')[0] || 'Learner'}?`
              : 'What can I wrangle up for ya?'}
          </h1>
          <p className={`text-sm ${theme.textMuted}`}>
            Your GitHub-verified AI learning mentor. Turn real repository commits into career readiness, targeted roadmaps, and interview defense.
          </p>
        </div>

        {/* Notion AI Prompt Box */}
        <div className="w-full max-w-2xl">
          <form
            onSubmit={handlePromptSubmit}
            className={`relative rounded-2xl border ${theme.border} ${theme.card} p-3 shadow-2xl transition-all focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/20`}
          >
            <textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handlePromptSubmit(e)
                }
              }}
              placeholder="Ask SkillForge AI anything… (e.g., 'What is my weakest skill gap?' or 'How do I learn FastAPI?')"
              className={`w-full bg-transparent resize-none text-sm ${theme.text} placeholder-slate-500 focus:outline-none scrollbar-none`}
            />

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.04]">
              {/* Quick Action Pills inside box */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setPrompt('Review my top skill gaps and suggest where to start.')
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border ${theme.border} ${theme.textMuted} hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1`}
                >
                  <span>+</span> Review for me
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPrompt('What project should I build next to improve my portfolio?')
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border ${theme.border} ${theme.textMuted} hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1`}
                >
                  <span>💡</span> Project ideas
                </button>
              </div>

              {/* Submit Arrow */}
              <button
                type="submit"
                disabled={!prompt.trim()}
                className="w-8 h-8 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:hover:bg-emerald-500 text-gray-950 flex items-center justify-center transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                title="Send to AI Mentor"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
            </div>
          </form>

          {/* Connected App Badges (as in Notion AI) */}
          <div className="flex items-center justify-center gap-3 mt-3 text-xs text-slate-400">
            <span className="text-[11px] opacity-70">Grounded in:</span>
            <div className="flex items-center gap-2">
              {integrations.map((app) => (
                <span
                  key={app.name}
                  className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06]"
                  title={app.name}
                >
                  <span>{app.icon}</span>
                  <span className="hidden sm:inline">{app.name}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Notion Quick Navigation Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {quickPills.map((pill) => (
            <button
              key={pill.id}
              onClick={() => onNavigate(pill.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border ${theme.border} ${theme.card} hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all text-xs font-medium ${theme.text} shadow-sm group`}
            >
              <span className="text-base group-hover:scale-110 transition-transform">{pill.icon}</span>
              <span>{pill.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Interactive Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
        {/* User Status / Connect Card */}
        <div className={`${theme.card} border ${theme.border} rounded-2xl p-5 space-y-4`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted}`}>
              Learner Profile
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {currentUser ? 'Active Session' : 'Guest'}
            </span>
          </div>

          {currentUser ? (
            <div className="flex items-center gap-3.5">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt=""
                  className="w-12 h-12 rounded-xl border border-emerald-500/40 object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-lg">
                  {(currentUser.displayName || currentUser.email || 'U')[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate ${theme.text}`}>
                  {userProfile?.display_name || currentUser.displayName || 'Learner'}
                </p>
                <p className={`text-xs truncate ${theme.textMuted}`}>
                  {currentUser.email}
                </p>
                <p className="text-[10px] font-mono text-emerald-400 mt-0.5">
                  ✓ Verified in MongoDB Atlas
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className={`text-xs ${theme.textMuted}`}>
                Sign in to sync your GitHub profile, calculate real skill metrics, and save learning progress.
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="w-full py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-gray-950 transition-colors shadow-md shadow-emerald-500/10 cursor-pointer"
              >
                Sign In with Google / Email
              </button>
            </div>
          )}
        </div>

        {/* System Health Status */}
        <div className={`${theme.card} border ${theme.border} rounded-2xl p-5 space-y-3`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted}`}>
              Engine Health
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
              Zero-Downtime
            </span>
          </div>

          <div className={`space-y-2.5 ${theme.textMuted} pt-1`}>
            <StatusDot ok={health?.backend ?? null} label="FastAPI Scoring Engine" />
            <StatusDot ok={health?.database ?? null} label="MongoDB Atlas Multi-Region" />
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-800 text-[11px] text-red-300">
              Connection notice: {error}
            </div>
          )}
        </div>
      </div>

      <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
